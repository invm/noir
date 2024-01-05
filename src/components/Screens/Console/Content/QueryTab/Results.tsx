import { createEffect, createResource, createSignal, on } from 'solid-js';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { Pagination } from './components/Pagination';
import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';

import { ColDef } from 'ag-grid-community';
import AgGridSolid from 'ag-grid-solid';
import { ContentTabData } from 'services/Connections';
import { NoResults } from './components/NoResults';
import { Loader } from 'components/UI';
import Keymaps from 'components/UI/Keymaps';

const getColumnDefs = (rows: Row[]): ColDef[] => {
  if (!rows || rows.length === 0) {
    return [];
  }
  return Object.keys(rows[0]).map((field) => ({
    editable: true,
    filter: true,
    field,
    headerName: field,
  }));
};

export const Results = () => {
  const {
    connections: { queryIdx, contentStore },
    backend: { getQueryResults, pageSize },
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

  const [data] = createResource(
    () =>
      [
        page(),
        queryIdx(),
        pageSize(),
        (contentStore.tabs[contentStore.idx].data as ContentTabData['Query']).result_sets,
      ] as const,
    async ([pageVal, queryIdxVal, pageSizeVal, result_sets]) => {
      // Reruns when either signal updates
      const result_set = result_sets[queryIdxVal];
      console.log('rerun', { result_set: result_set?.id });
      if (!result_set || result_set?.status !== 'Completed') {
        return { rows: [], columns: [], exhausted: true, notReady: true };
      }
      if (result_set.rows) {
        // check this exhausted prop
        const columns = getColumnDefs(result_set.rows);
        return { rows: result_set.rows, columns, exhausted: true };
      }
      const rows = await getQueryResults(result_set.path!, pageVal, pageSizeVal);
      const columns = getColumnDefs(rows);
      return { rows, columns, exhausted: rows.length < pageSizeVal };
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

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <dialog id="my_modal_1" class="modal">
        <div class="modal-box min-w-[1000px] max-h-full h-[80%]">
          <div class="h-full">
            <div ref={ref} class="h-full" />
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <Pagination {...{ page, onNextPage, onPrevPage, loading: data.loading, setPage }} />
      <div class="ag-theme-alpine-dark" style={{ height: '100%' }}>
        <AgGridSolid
          noRowsOverlayComponent={() => (data()?.notReady ? <Keymaps /> : <NoResults />)}
          loadingOverlayComponent={() => <Loader />}
          onCellContextMenu={(e) => {
            console.log(e);
          }}
          columnDefs={data()?.columns}
          rowData={data()?.rows}
          defaultColDef={defaultColDef}
        />
      </div>
    </div>
  );
};
