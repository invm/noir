import { createEffect, createResource, createSignal, Show } from 'solid-js';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { ColDef } from 'ag-grid-community';
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';

import { useAppSelector } from 'services/Context';
import { QueryTaskEnqueueResult, Row } from 'interfaces';
import { ContentTabData } from 'services/Connections';
import { Pagination } from './components/Pagination';
import { NoResults } from './components/NoResults';
import { Loader } from 'components/UI';
import Keymaps from 'components/UI/Keymaps';
import { t } from 'utils/i18n';
import { getAnyCase, parseObjRecursive } from 'utils/utils';
import { save } from '@tauri-apps/api/dialog';
import { Key } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';

const getColumnDefs = (rows: Row[], columns: Row[], constraints: Row[]): ColDef[] => {
  if (!rows || rows.length === 0) {
    return [];
  }
  return Object.keys(rows[0]).map((field, _i) => {
    const key = constraints.find((c) => {
      const t = getAnyCase(c, 'COLUMN_NAME');
      return t === field;
    });
    const col =
      columns.find((c) => {
        const t = getAnyCase(c, 'COLUMN_NAME');
        if (t === field) {
          return true;
        }
      }) ?? {};
    const visible_type = getAnyCase(col, 'COLUMN_TYPE');
    // const type = visible_type?.split('(')[0];
    // let gridType = 'text';
    // if (type.includes('int') || type === 'decimal' || type === 'float' || type === 'double') {
    //   gridType = 'number';
    // } else if (type === 'date' || type === 'datetime' || type === 'timestamp') {
    //   gridType = 'dateString';
    // } else if (type === 'tinyint' || type === 'boolean') {
    //   gridType = 'boolean';
    // } else if (type === 'json' || type === 'jsonb') {
    //   gridType = 'object';
    // }

    return {
      // editable: !key,
      // checkboxSelection: _i === 0,
      filter: true,
      // type: gridType,
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
  });
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

export const Results = (props: { editable?: boolean; table?: string }) => {
  const {
    connections: { queryIdx, contentStore, getConnection, updateContentTab },
    backend: { getQueryResults, pageSize, downloadCsv },
    messages: { notify },
  } = useAppSelector();
  const [code, setCode] = createSignal('');
  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
  });
  createEditorControlledValue(editorView, code);
  createExtension(() => search());
  createExtension(dracula);
  createExtension(basicSetup);
  createExtension(json);
  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  const [page, setPage] = createSignal(0);
  const [table, setTable] = createSignal('');
  const [changes, setChanges] = createSignal<Changes>({});
  const [constraints, setConstraints] = createSignal<Row[]>([]);

  const menu_id = 'table-row-menu';

  const { show } = useContextMenu({ id: menu_id, props: { rows: {} as Row } });

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
        if (!result_set || result_set?.status !== 'Completed') {
          return { rows: [], columns: [], exhausted: true, notReady: true };
        }
        const rows = await getQueryResults(result_set.path!, pageVal, pageSizeVal);
        setConstraints(result_set.constraints ?? []);
        setTable(result_set.table ?? '');
        const columns = getColumnDefs(
          rows,
          result_set.columns ?? [],
          props.editable ? result_set.constraints ?? [] : []
        );
        return { rows, columns, exhausted: rows.length < pageSizeVal, path: result_set.path };
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
    flex: 1,
    minWidth: 320,
  };

  let gridRef: AgGridSolidRef;

  const onBtnExport = async () => {
    const filename = new Date().toISOString() + '.csv';
    const filePath = (await save({ defaultPath: filename })) ?? '';
    const dataPath = data()?.path;
    if (!filePath || !dataPath) return;
    await downloadCsv(dataPath, filePath).catch((err) => notify(err));
  };

  const applyChanges = async () => {
    const allChanges = changes();
    try {
      const queries = Object.keys(allChanges).map((rowIndex) => {
        let statement = `UPDATE ${table()} SET `;
        const row = allChanges[rowIndex];
        const params = Object.values(row.changes)
          .reduce((acc, val) => [...acc, val], [] as string[])
          .concat(row.updateVal)
          .map(String);
        const _changes = Object.keys(row.changes).map((key) => key + ' = ?');
        statement += _changes.join(', ') + ` WHERE ${row.updateKey} = ?`;
        return { statement, params };
      });
      const conn = getConnection();
      await invoke('execute_tx', { queries, connId: conn.id });
      setChanges({});
      await invoke('invalidate_query', { path: data()?.path });
      const query = 'SELECT * from ' + props.table!;
      const { result_sets } = await invoke<QueryTaskEnqueueResult>('enqueue_query', {
        connId: conn.id,
        sql: query,
        autoLimit: true,
        tabIdx: contentStore.idx,
        table: {
          table,
          with_constraints: true,
        },
      });
      updateContentTab('data', {
        result_sets: result_sets.map((id) => ({ id })),
      });
    } catch (error) {
      notify(error);
    }
  };

  const resetChanges = async () => {
    gridRef.api?.undoCellEditing();
    setChanges({});
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
        }}
      />
      <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
        <Item
          onClick={({ props: { row } }) => {
            const data = parseObjRecursive(row);
            setCode(JSON.stringify(data, null, 4));
            (document.getElementById('row_modal') as HTMLDialogElement).showModal();
          }}>
          {t('console.table.show_row')}
        </Item>
        <Item
          onClick={({ props: { row } }) => {
            navigator.clipboard.writeText(JSON.stringify(row));
          }}>
          {t('console.table.copy_to_clipboard')}
        </Item>
      </Menu>
      <div class="ag-theme-alpine-dark" style={{ height: '100%' }}>
        <AgGridSolid
          noRowsOverlayComponent={() => (data()?.notReady ? <Keymaps /> : <NoResults error={data()?.error} />)}
          loadingOverlayComponent={() => <Loader />}
          onCellContextMenu={(e) => {
            e.event?.preventDefault();
            show(e.event as MouseEvent, { props: { row: e.data } });
          }}
          ref={gridRef!}
          columnDefs={data()?.columns}
          rowSelection="multiple"
          rowData={data()?.rows}
          defaultColDef={defaultColDef}
          enableCellChangeFlash={true}
          undoRedoCellEditing={true}
          suppressExcelExport={true}
          suppressCsvExport={false}
          onCellEditingStopped={(e) => {
            if (e.valueChanged) {
              const updateCol = constraints().find((c) => +getAnyCase(c, 'ORDINAL_POSITION') === 1);
              const updateKey = updateCol ? getAnyCase(updateCol, 'COLUMN_NAME') : Object.keys(e.data)[0];
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
          }}
        />
      </div>
    </div>
  );
};
