import { createEffect, createResource, createSignal, on, Show } from 'solid-js';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { ColDef } from 'ag-grid-community';
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';

import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';
import { ContentTabData } from 'services/Connections';
import { Pagination } from './components/Pagination';
import { NoResults } from './components/NoResults';
import { Loader } from 'components/UI';
import Keymaps from 'components/UI/Keymaps';
import { t } from 'utils/i18n';
import { getAnyCase, parseObjRecursive } from 'utils/utils';
import { save } from '@tauri-apps/api/dialog';
import { Key } from 'components/UI/Icons';

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
    return {
      editable: !key,
      // checkboxSelection: _i === 0,
      filter: true,
      headerComponent: () => (
        <div class="flex items-center justify-between w-full">
          <div>
            <span class="mr-2 text-sm">{field}</span>
            <span class="text-xs text-base-content">{getAnyCase(col, 'COLUMN_TYPE')}</span>
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

export const Results = (props: { editable: boolean }) => {
  const {
    connections: { queryIdx, contentStore },
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

  createEffect(
    on(queryIdx, () => {
      setPage(0);
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
      <Pagination {...{ page, onNextPage, onPrevPage, loading: data.loading, setPage, onBtnExport }} />
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
          noRowsOverlayComponent={() => (data()?.notReady ? <Keymaps /> : <NoResults error={String(data()?.error)} />)}
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
          suppressExcelExport={true}
          suppressCsvExport={false}
          onCellEditingStopped={(e) => {
            console.log({ e });
          }}
        />
      </div>
    </div>
  );
};
