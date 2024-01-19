import { createEffect, createResource, createSignal, Setter, Show } from 'solid-js';
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
import Keymaps from 'components/UI/Keymaps';
import { getAnyCase } from 'utils/utils';
import { save } from '@tauri-apps/api/dialog';
import { Key } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';
import { update } from 'sql-bricks';
import { editorThemes } from './Editor';
import { EditorTheme } from 'services/App';
import PopupCellRenderer, { PopupCellRendererProps } from './Table/PopupCellRenderer';
import { tippy } from 'solid-tippy';
import { t } from 'utils/i18n';
import { Drawer } from './Table/Drawer';
import { createStore } from 'solid-js/store';
import { Search } from './components/Search';
tippy;

const getColumnDefs = ({
  columns,
  constraints,
  setCode,
  editable,
  openDrawer,
  setChanges,
  row,
}: {
  setCode: (code: string) => void;
  openDrawer: (row: Row, columns: Row[], rowIndex: number, constraints: Row[]) => void;
  columns: Row[];
  constraints: Row[];
  editable: boolean;
  setChanges: Setter<Changes>;
  row: Row;
}): ColDef[] => {
  return (columns.length ? columns : Object.keys(row)).map((col, _i) => {
    const name = getAnyCase(col, 'column_name') || col;
    const key = constraints.find((c) => {
      const t = getAnyCase(c, 'column_name');
      return t === name;
    });
    const visible_type = getAnyCase(col, 'column_type') || '';

    return {
      editable: true,
      singleClickEdit: true,
      // checkboxSelection: _i === 0,
      resizable: true,
      cellRenderer: (p: PopupCellRendererProps) => (
        <PopupCellRenderer {...p} {...{ setChanges, editable, setCode, openDrawer, columns, constraints }} />
      ),
      filter: true,
      width: 300,
      headerComponent: () => (
        <div class="flex items-center justify-between w-full">
          <div>
            <span class="mr-2 text-sm">{name}</span>
            <span class="text-xs text-base-content">{visible_type}</span>
          </div>
          <Show when={key}>
            <Key />
          </Show>
        </div>
      ),
      sortable: true,
      field: name,
      headerName: name,
    };
  });
};

export type Changes = {
  updates: {
    [rowIndex: string]: {
      updateKey: string;
      updateVal: string;
      changes: {
        [key: string]: string;
      };
    };
  };
  deletes: {
    [deleteKey: string]: string;
  };
  creates: {
    [rowIndex: string]: {
      [key: string]: string;
    };
  };
};

const defaultChanges: Changes = { updates: {}, deletes: {}, creates: {} };

export const Results = (props: { editorTheme: EditorTheme; gridTheme: string; editable?: boolean; table?: string }) => {
  const {
    connections: { queryIdx, getConnection, updateContentTab, getContentData },
    backend: { getQueryResults, pageSize, downloadCsv, downloadJSON, selectAllFrom },
    messages: { notify },
  } = useAppSelector();

  const [drawerOpen, setDrawerOpen] = createStore({
    open: false,
    data: {} as Row,
    columns: [] as Row[],
    constraints: [] as Row[],
    rowIndex: 0,
  });
  const [code, setCode] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [table, setTable] = createSignal('');
  const [changes, setChanges] = createSignal<Changes>(defaultChanges);
  const [constraints, setConstraints] = createSignal<Row[]>([]);

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

  const openDrawer = (data: Row, columns: Row[], rowIndex: number, constraints: Row[]) => {
    setDrawerOpen({ open: true, data, columns, rowIndex, constraints });
  };

  const [data] = createResource(
    () => [page(), queryIdx(), pageSize(), getContentData('Query')?.result_sets] as const,
    async ([pageVal, queryIdxVal, pageSizeVal, result_sets]) => {
      try {
        // Reruns when either signal updates
        const result_set = result_sets[queryIdxVal];
        const columns = result_set?.columns ?? [];
        const constraints = result_set?.constraints ?? [];
        let colDef = getColumnDefs({
          columns,
          constraints,
          setCode,
          editable: !!props.editable,
          openDrawer,
          setChanges,
          row: result_set?.rows?.[0] ?? {},
        });
        if (result_set?.rows?.length) {
          return { rows: result_set.rows, columns, colDef, count: result_set.count };
        }
        if (!result_set || result_set?.status !== 'Completed') {
          return { rows: [], columns, colDef, exhausted: true, notReady: true };
        }
        const rows = await getQueryResults(result_set.path!, pageVal, pageSizeVal);
        colDef = getColumnDefs({
          columns,
          constraints,
          setCode,
          editable: !!props.editable,
          openDrawer,
          setChanges,
          row: rows[0] ?? {},
        });
        setConstraints(constraints);
        setTable(result_set.table ?? '');
        return {
          columns,
          rows,
          colDef,
          count: result_set.count,
          exhausted: rows.length < pageSizeVal,
          path: result_set.path,
        };
      } catch (error) {
        notify(error);
        return { rows: [], columns: [], exhausted: true, error };
      }
    }
  );

  createEffect(() => {
    setPage(0);
    setConstraints([]);
    setChanges(defaultChanges);
    setTable('');
  }, [queryIdx, getConnection().idx]);

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

  const defaultColDef: ColDef = {
    minWidth: 30,
    suppressMovable: true,
  };

  let gridRef: AgGridSolidRef;

  const onBtnExport = async (t: 'csv' | 'json') => {
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
    const allChanges = changes();
    try {
      const conn = getConnection();
      const _table = table();
      const queries = Object.keys(allChanges['updates'] ?? {}).map((rowIndex) => {
        const row = allChanges['updates']?.[rowIndex];
        return update(_table, { ...row.changes })
          .where({ [row.updateKey]: row.updateVal })
          .toString();
      });
      await invoke('execute_tx', { queries, connId: conn.id });
      await invoke('invalidate_query', { path: data()?.path });
      const result_sets = await selectAllFrom(props.table!, conn.id, getConnection().idx);
      updateContentTab('data', {
        result_sets: result_sets.map((id) => ({ id })),
      });
      setChanges(defaultChanges);
      notify(t('console.table.successfully_updated', { count: Object.keys(allChanges).length }), 'success');
    } catch (error) {
      notify(error);
    }
  };

  const resetChanges = async () => {
    const undoSize = gridRef.api?.getCurrentUndoSize();
    for (let i = 0; i < undoSize!; i++) {
      gridRef.api?.undoCellEditing();
    }
    setChanges(defaultChanges);
  };

  const onCellEditingStopped = (e: CellEditingStoppedEvent) => {
    if (e.valueChanged) {
      const updateCol = constraints().find((c) => getAnyCase(c, 'constraint_name') === 'PRIMARY');
      const updateKey = updateCol ? getAnyCase(updateCol, 'column_name') : Object.keys(e.data)[0];
      const change = e.column.getColId();
      setChanges((s) => ({
        ...s,
        updates: {
          ...s.updates,
          [e.rowIndex ?? '']: {
            updateKey,
            updateVal: e.data[updateKey],
            changes: {
              ...s['updates'][e.rowIndex ?? '']?.changes,
              [change]: e.newValue,
            },
          },
        },
      }));
    }
  };

  const saveForm = async () => {
    const updateCol = constraints().find((c) => +getAnyCase(c, 'ordinal_position') === 1);
    const updateKey = updateCol ? getAnyCase(updateCol, 'column_name') : Object.keys(drawerOpen.data)[0];
    setChanges((c) => ({
      ...c,
      updates: {
        ...c.updates,
        [drawerOpen.rowIndex]: {
          updateKey,
          updateVal: drawerOpen.data[updateKey],
          changes: drawerOpen.data,
        },
      },
    }));
    await applyChanges();
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
            changesCount: Object.keys(changes()).reduce((acc, key) => {
              return acc + Object.keys(changes()[key as 'updates']).length;
            }, 0),
            resetChanges,
            applyChanges,
            page,
            onNextPage,
            onPrevPage,
            loading: data.loading,
            hasResults: !!data()?.rows.length,
            onPageSizeChange,
            onBtnExport,
            count: data()?.count ?? 0,
          }}
        />
        <Search colDef={data()?.colDef ?? []} table={props.table ?? ''} columns={data()?.columns ?? []} />
      </div>
      <div class={'ag-theme-' + props.gridTheme} style={{ height: '100%' }}>
        <AgGridSolid
          noRowsOverlayComponent={() => (data()?.notReady ? <Keymaps /> : <NoResults error={data()?.error} />)}
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
