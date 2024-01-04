import { createEffect, createSignal, on } from 'solid-js';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { Pagination } from './components/Pagination';
import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';
import { Table } from './components/Table';
import { createStore } from 'solid-js/store';

export const Results = () => {
  const {
    connections: { queryIdx, getContentData, contentStore },
    backend: { getQueryResults },
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

  const [rows, setRows] = createStore<Row[]>([]);
  // const [loaded, setLoaded] = createSignal(false);
  const [page, setPage] = createSignal(0);
  const [loading, setLoading] = createSignal(false);

  const updateRows = async () => {
    try {
      setLoading(true);
      // setLoaded(false);
      const result_set = getContentData('Query').result_sets[queryIdx()];
      if (result_set?.rows) {
        setRows(result_set.rows);
        return;
      }
      if (result_set?.status !== 'Completed') {
        setRows([]);
        return;
      }
      const _rows = await getQueryResults(result_set.path!, page());
      setRows(_rows);
      // setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // on initial render, this update rows is called twice
  createEffect(
    on(queryIdx, () => {
      setPage(0);
      updateRows();
    })
  );

  createEffect(updateRows, contentStore.idx);

  const onNextPage = async () => {
    setPage(page() + 1);
    updateRows();
  };

  const onPrevPage = async () => {
    if (page() === 0) return;
    setPage(page() - 1);
    updateRows();
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
      <Pagination {...{ page, onNextPage, onPrevPage, loading, setPage }} />
      <Table rows={rows} />
    </div>
  );
};
