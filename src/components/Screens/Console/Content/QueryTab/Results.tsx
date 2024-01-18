import { createEffect, createResource, createSignal, Match, Show, Switch } from 'solid-js';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { CellEditingStoppedEvent, ColDef } from 'ag-grid-community';
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';
import { ContentTabData } from 'services/Connections';
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
tippy;

const getColumnDefs = (
  rows: Row[],
  {
    columns,
    constraints,
    setCode,
    editable,
  }: {
    setCode: (code: string) => void;
    columns: Row[];
    constraints: Row[];
    editable: boolean;
  }
): ColDef[] => {
  const cols: ColDef[] = [];
  if (!rows || rows.length === 0) {
    return cols;
  }

  const c = Object.keys(rows[0]);

  return cols.concat(
    c.map((field, _i) => {
      const key = constraints.find((c) => {
        const t = getAnyCase(c, 'column_name');
        return t === field;
      });
      const col =
        columns.find((c) => {
          const t = getAnyCase(c, 'column_name');
          if (t === field) {
            return true;
          }
        }) ?? {};
      const visible_type = getAnyCase(col, 'column_type');

      return {
        editable: !key && columns.length > 0,
        singleClickEdit: true,
        // checkboxSelection: _i === 0,
        resizable: true,
        cellRenderer: (p: PopupCellRendererProps) => <PopupCellRenderer {...p} editable={editable} setCode={setCode} />,
        filter: true,
        ...(c.length === 1 && { flex: 1 }),
        width: 300,
        headerComponent: () => (
          <div class="flex items-center justify-between w-full">
            <div>
              <span class="mr-2 text-sm">{field}</span>
              <span class="text-xs text-base-content">{visible_type}</span>
            </div>
            <Show when={key}>
              <Key />
            </Show>
          </div>
        ),
        sortable: true,
        field,
        headerName: field,
      };
    })
  );
};

type Changes = {
  [rowIndes: string]: {
    updateKey: string;
    updateVal: string;
    changes: {
      [key: string]: string;
    };
  };
};

export const Results = (props: { editorTheme: EditorTheme; gridTheme: string; editable?: boolean; table?: string }) => {
  const {
    connections: { queryIdx, contentStore, getConnection, updateContentTab },
    backend: { getQueryResults, pageSize, downloadCsv, downloadJSON, selectAllFrom },
    messages: { notify },
  } = useAppSelector();

  const [code, setCode] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [table, setTable] = createSignal('');
  const [changes, setChanges] = createSignal<Changes>({});
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

  const [data] = createResource(
    () =>
      [
        page(),
        queryIdx(),
        pageSize(),
        (contentStore.tabs[contentStore.idx].data as ContentTabData['Query']).result_sets,
      ] as const,
    async ([pageVal, queryIdxVal, pageSizeVal, result_sets]) => {
      try {
        // Reruns when either signal updates
        const result_set = result_sets[queryIdxVal];
        if (result_set?.rows?.length) {
          const columns = getColumnDefs(result_set.rows, {
            columns: result_set.columns ?? [],
            constraints: [],
            setCode,
            editable: !!props.editable,
          });
          return { rows: result_set.rows, columns, count: result_set.count };
        }
        if (!result_set || result_set?.status !== 'Completed') {
          return { rows: [], columns: [], exhausted: true, notReady: true };
        }
        const rows = await getQueryResults(result_set.path!, pageVal, pageSizeVal);
        setConstraints(result_set.constraints ?? []);
        setTable(result_set.table ?? '');
        const columns = getColumnDefs(rows, {
          columns: result_set.columns ?? [],
          constraints: result_set.constraints ?? [],
          setCode,
          editable: !!props.editable,
        });
        return {
          rows,
          columns,
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
    setChanges({});
    setTable('');
  }, [queryIdx, contentStore.idx]);

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
      const queries = Object.keys(allChanges).map((rowIndex) => {
        const row = allChanges[rowIndex];
        const rg = new RegExp(`\\"${table}\\"`, 'i');
        return update(_table, row.changes)
          .where({ [row.updateKey]: row.updateVal })
          .toString()
          .replace(rg, _table);
      });
      await invoke('execute_tx', { queries, connId: conn.id });
      await invoke('invalidate_query', { path: data()?.path });
      const results_sets = await selectAllFrom(props.table!, conn.id, contentStore.idx);
      updateContentTab('data', {
        result_sets: results_sets.map((id) => ({ id })),
      });
      setChanges({});
      notify(t('console.table.successfully_updated', { count: Object.keys(allChanges).length }), 'success');
    } catch (error) {
      notify(error);
    }
  };

  const resetChanges = async () => {
    gridRef.api?.undoCellEditing();
    setChanges({});
  };

  const onCellEditingStopped = (e: CellEditingStoppedEvent) => {
    if (e.valueChanged) {
      const updateCol = constraints().find((c) => +getAnyCase(c, 'ordinal_position') === 1);
      const updateKey = updateCol ? getAnyCase(updateCol, 'column_name') : Object.keys(e.data)[0];
      const change = e.column.getColId();
      const _changes = changes();
      setChanges({
        ..._changes,
        [e.rowIndex ?? '']: {
          updateKey,
          updateVal: e.data[updateKey],
          changes: {
            ..._changes[e.rowIndex ?? '']?.changes,
            [change]: e.newValue,
          },
        },
      });
    }
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
      <Pagination
        {...{
          changesCount: Object.keys(changes()).length,
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
          table: props.table ?? '',
          columns: data()?.columns ?? [],
        }}
      />
      <div class={'ag-theme-' + props.gridTheme} style={{ height: '100%' }}>
        <Switch>
          <Match when={data()?.notReady}>
            <div class="flex items-center justify-center h-full">
              <Keymaps />
            </div>
          </Match>
          <Match when={!data()?.notReady}>
            <AgGridSolid
              noRowsOverlayComponent={() => <NoResults error={data()?.error} />}
              loadingOverlayComponent={() => <Loader />}
              ref={gridRef!}
              columnDefs={data()?.columns}
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
          </Match>
        </Switch>
      </div>
    </div>
  );
};
