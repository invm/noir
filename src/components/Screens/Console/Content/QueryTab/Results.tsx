import { createEffect, createResource, createSignal, on, Show } from 'solid-js';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { CellEditingStoppedEvent, ColDef } from 'ag-grid-community';
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';
import { Pagination } from './components/Pagination';
import { NoResults } from './components/NoResults';
import { Loader } from 'components/UI';
import { getAnyCase } from 'utils/utils';
import { save } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api';
import { deleteFrom, insert, update } from 'sql-bricks';
import { editorThemes } from './Editor';
import { EditorTheme } from 'services/App';
import { tippy } from 'solid-tippy';
import { t } from 'utils/i18n';
import { Drawer } from './Table/Drawer';
import { createStore, produce } from 'solid-js/store';
import { Search } from './components/Search';
import { Changes, getColumnDefs } from './Table/utils';
import { createShortcut } from '@solid-primitives/keyboard';
import Keymaps from 'components/Screens/Settings/Keymaps/Keymaps';
tippy;

const defaultChanges: Changes = { update: {}, delete: {}, add: {} };

export const Results = (props: { editorTheme: EditorTheme; gridTheme: string; editable?: boolean; table?: string }) => {
  const {
    connections: { queryIdx, getConnection, updateContentTab, getContentData },
    backend: { getQueryResults, pageSize, downloadCsv, downloadJSON, selectAllFrom },
    messages: { notify },
    app: { cmdOrCtrl },
  } = useAppSelector();

  const [drawerOpen, setDrawerOpen] = createStore({
    mode: 'add' as 'add' | 'edit',
    open: false,
    data: {} as Row,
    columns: [] as Row[],
    foreign_keys: [] as Row[],
    primary_key: [] as Row[],
    rowIndex: 0,
  });
  const [code, setCode] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [table, setTable] = createStore({
    name: '',
    foreign_keys: [] as Row[],
    primary_key: [] as Row[],
    columns: [] as Row[],
  });
  const [changes, setChanges] = createStore<Changes>(defaultChanges);
  const idx = () => getConnection().idx;

  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
  });
  createEditorControlledValue(editorView, code);
  createExtension(() => search());
  createExtension(basicSetup);
  createExtension(json);
  createExtension(editorThemes[props.editorTheme]);
  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  const openDrawerForm = ({ rowIndex, mode, data: row }: { data: Row; rowIndex?: number; mode: 'add' | 'edit' }) => {
    if (!props.editable) return;
    setDrawerOpen({
      mode,
      open: true,
      data: row,
      columns: table.columns,
      foreign_keys: table.foreign_keys,
      primary_key: table.primary_key,
      rowIndex,
    });
  };

  createShortcut(['Escape'], () => {
    if (drawerOpen.open) setDrawerOpen({ open: false });
  });

  const [data] = createResource(
    () => [page(), queryIdx(), pageSize(), getContentData('Query')?.result_sets] as const,
    async ([pageVal, queryIdxVal, pageSizeVal, result_sets]) => {
      try {
        // Reruns when either signal updates
        const result_set = result_sets[queryIdxVal];
        const columns = result_set?.columns ?? [];
        const foreign_keys = result_set?.foreign_keys ?? [];
        const primary_key = result_set?.primary_key ?? [];
        const start_time = result_set?.start_time ?? 0;
        const end_time = result_set?.end_time ?? 0;
        setTable({ name: result_set?.table ?? '', columns, foreign_keys, primary_key });
        let colDef = getColumnDefs({
          columns,
          foreign_keys,
          primary_key,
          setCode,
          editable: !!props.editable,
          setChanges,
          row: result_set?.rows?.[0] ?? {},
          openDrawerForm,
        });
        if (result_set?.rows?.length) {
          return { rows: result_set.rows, columns, colDef, count: result_set.count, start_time, end_time };
        }
        if (!result_set || result_set?.status !== 'Completed') {
          return { rows: [], columns, colDef, exhausted: true, notReady: true };
        }
        const rows = await getQueryResults(result_set.path!, pageVal, pageSizeVal);
        colDef = getColumnDefs({
          columns,
          foreign_keys,
          primary_key,
          setCode,
          editable: !!props.editable,
          setChanges,
          row: rows[0] ?? {},
          openDrawerForm,
        });
        return {
          columns,
          rows,
          colDef,
          count: result_set.count,
          exhausted: rows.length < pageSizeVal,
          path: result_set.path,
          start_time,
          end_time,
        };
      } catch (error) {
        notify(error);
        return { rows: [], columns: [], exhausted: true, error };
      }
    }
  );

  createEffect(
    on(idx, () => {
      setPage(0);
      resetChanges();
    })
  );

  const onNextPage = async () => {
    if (data()?.exhausted) return;
    setPage(page() + 1);
  };

  const onPrevPage = async () => {
    if (page() === 0) return;
    setPage(page() - 1);
  };

  const onPageSizeChange = () => {
    setPage(0);
  };

  let gridRef: AgGridSolidRef;

  const onBtnExport = async (t: 'csv' | 'json') => {
    if (!data().path) return;
    const filename = props.table + '_' + new Date().toISOString() + '.' + t;
    const filePath = (await save({ defaultPath: filename })) ?? '';
    const dataPath = data()?.path;
    if (!filePath || !dataPath) return;
    if (t === 'json') {
      await downloadJSON(dataPath, filePath).catch((err) => notify(err));
    } else {
      await downloadCsv(dataPath, filePath).catch((err) => notify(err));
    }
  };

  const applyChanges = async () => {
    try {
      const _table = table.name;
      const queries = [];
      if (Object.keys(changes['add']).length) {
        const inserts = Object.keys(changes['add']).map((rowIndex) => {
          const row = changes['add'];
          return insert(_table).values(row[rowIndex].changes).toString();
        });
        queries.push(...inserts);
      }
      if (Object.keys(changes['update']).length) {
        const updates = Object.keys(changes['update']).map((rowIndex) => {
          const row = changes['update']?.[rowIndex];
          return update(_table, { ...row.changes })
            .where(row.condition)
            .toString();
        });
        queries.push(...updates);
      }
      if (Object.keys(changes['delete']).length) {
        const deletes = Object.keys(changes['delete']).map((rowIndex) => {
          const row = changes['delete'];
          return deleteFrom(_table).where(row[rowIndex].condition).toString();
        });
        queries.push(...deletes);
      }
      if (queries.length === 0) return;
      const conn = getConnection();
      await invoke('execute_tx', { queries, connId: conn.id });
      await invoke('invalidate_query', { path: data()?.path });
      const result_sets = await selectAllFrom(props.table!, conn.id, getConnection().idx);
      updateContentTab('data', {
        result_sets: result_sets.map((id) => ({ id })),
      });
      Object.keys(changes).forEach((key) => {
        const count = Object.keys(changes[key as keyof typeof changes]).length;
        if (count) notify(t(`console.table.successfull_${key}`, { count }), 'success');
      }, 0);
      resetChanges();
    } catch (error) {
      notify(error);
    }
  };

  const resetChanges = () => {
    setChanges(
      produce((s) => {
        s.update = {};
        s.delete = {};
        s.add = {};
      })
    );
  };

  const undoChanges = async () => {
    const undoSize = gridRef.api?.getCurrentUndoSize();
    for (let i = 0; i < undoSize!; i++) {
      gridRef.api?.undoCellEditing();
    }
    resetChanges();
  };

  const onCellEditingStopped = (e: CellEditingStoppedEvent) => {
    if (e.valueChanged) {
      const condition = table.primary_key.reduce((acc, c) => {
        const col = getAnyCase(c, 'column_name');
        return { ...acc, [col]: e.data[col] };
      }, {});
      const change = e.column.getColId();
      const idx = String(e.rowIndex);
      setChanges('update', idx, {
        condition,
        changes: { [change]: e.newValue },
      });
    }
  };

  const saveForm = async () => {
    if (!drawerOpen.data) return;
    const condition = table.primary_key.reduce((acc, c) => {
      const col = getAnyCase(c, 'column_name');
      return { ...acc, [col]: drawerOpen.data[col] };
    }, {});
    if (drawerOpen.mode === 'add') {
      const key = Object.values(condition).join('_');
      setChanges('add', key, { changes: drawerOpen.data });
    } else {
      const idx = String(drawerOpen.rowIndex);
      setChanges('update', idx, { condition, changes: drawerOpen.data });
    }
    await applyChanges();
    setDrawerOpen({ open: false, data: {} });
  };

  createShortcut([cmdOrCtrl(), 's'], () => {
    if (!props.editable) return;
    if (drawerOpen.open) {
      saveForm();
    } else {
      applyChanges();
    }
  });

  const defaultColDef: ColDef = {
    minWidth: 30,
    suppressMovable: true,
    editable: true,
    sortable: true,
    singleClickEdit: true,
    resizable: true,
    filter: true,
    width: 300,
  };

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <dialog id="row_modal" class="modal">
        <div class="modal-box min-w-[1000px] max-h-full h-[80%]">
          <div class="h-full">
            <div ref={ref} class="h-full" />
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div class="flex flex-col">
        <Pagination
          {...{
            changesCount: Object.keys(changes).reduce((acc, key) => {
              return acc + Object.keys(changes[key as keyof typeof changes]).length;
            }, 0),
            undoChanges,
            applyChanges,
            page,
            onNextPage,
            onPrevPage,
            loading: data.loading,
            hasResults: !!data()?.rows.length,
            onPageSizeChange,
            onBtnExport,
            count: data()?.count ?? 0,
            openDrawerForm: props.editable ? openDrawerForm : undefined,
            executionTime: (data()?.end_time ?? 0) - (data()?.start_time ?? 0),
          }}
        />
        <Search table={table.name} columns={table.columns} />
      </div>
      <div class={'ag-theme-' + props.gridTheme} style={{ height: '100%' }}>
        <AgGridSolid
          noRowsOverlayComponent={() => (data()?.notReady ? <Keymaps short /> : <NoResults error={data()?.error} />)}
          loadingOverlayComponent={Loader}
          ref={gridRef!}
          columnDefs={data()?.colDef}
          rowSelection="multiple"
          rowData={data()?.rows}
          defaultColDef={defaultColDef}
          enableCellChangeFlash={true}
          enableCellTextSelection={true}
          undoRedoCellEditing={true}
          suppressExcelExport={true}
          suppressCsvExport={false}
          onCellEditingStopped={onCellEditingStopped}
        />
      </div>
      <Show when={props.editable}>
        <div class="absolute right-0 top-0">
          <Drawer {...{ drawerOpen, setDrawerOpen, table: props.table ?? '', saveForm }} />
        </div>
      </Show>
    </div>
  );
};
