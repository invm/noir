import { createEffect, createSignal, on } from 'solid-js';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { search } from '@codemirror/search';
import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { createCodeMirror, createEditorControlledValue } from 'solid-codemirror';
import { Pagination } from './components/Pagination';
import { useAppSelector } from 'services/Context';
import { Row } from 'interfaces';
import Keymaps from 'components/UI/Keymaps';
import { NoResults } from './components/NoResults';

type TableColumn = { title: string; field: string; resizeable?: boolean };

const parseObjRecursive = (obj: unknown): Record<string, unknown | unknown[]> | null | unknown => {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(parseObjRecursive);
    } else if (obj !== null) {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, parseObjRecursive(v)]));
    } else {
      return obj;
    }
  } else {
    try {
      return JSON.parse(obj as string);
    } catch (e) {
      return obj;
    }
  }
};

export const ResultsTable = () => {
  const {
    connections: { queryIdx, getContentData },
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

  const [rows, setRows] = createSignal<Row[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [page, setPage] = createSignal(0);
  const [loading, setLoading] = createSignal(false);

  const updateRows = async () => {
    try {
      setLoading(true);
      setLoaded(false);
      const result_set = getContentData('Query').result_sets[queryIdx()];
      if (result_set?.rows) {
        setRows(result_set.rows);
        return;
      }
      if (result_set?.status !== 'Completed') {
        setRows([]);
        setLoaded(true);
        return;
      }
      const _rows = await getQueryResults(result_set.path!, page());
      setRows(_rows);
      setLoaded(true);
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

  createEffect(updateRows);

  createEffect(() => {
    let columns: TableColumn[] = [];
    const _loaded = loaded();
    const _rows = rows();
    if (_rows.length) {
      columns = Object.keys(_rows[0]).map((k) => ({
        title: k,
        field: k,
        // resizeable: true,
        // editor: "input" as const, // this will make the whole table navigable
      }));
    }

    new Tabulator('#results-table', {
      data: _rows,
      placeholder: (_loaded ? <NoResults /> : <Keymaps />) as HTMLElement,
      // autoColumns: true,
      columns,
      columnDefaults: {
        title: '',
        width: 300,
      },
      // layout: 'fitDataStretch',
      autoResize: false,
      clipboard: true,
      renderHorizontal: _rows.length > 0 ? 'virtual' : 'basic',
      renderVertical: 'virtual',
      pagination: false,
      maxHeight: '100%',
      minHeight: '100%',
      height: '100%',
      paginationCounter: 'rows',
      debugInvalidOptions: false,
      rowContextMenu: [
        {
          label: 'Show row in JSON',
          action: function(_e, row) {
            // @ts-ignore
            const data = parseObjRecursive(row._row.data);
            setCode(JSON.stringify(data, null, 4));
            // @ts-ignore
            document.getElementById('my_modal_1').showModal();
          },
        },
        {
          label: 'Copy row to clipboard as json',
          action: function(_e, row) {
            // @ts-ignore
            navigator.clipboard.writeText(JSON.stringify(row._row.data));
          },
        },
        {
          separator: true,
        },
      ],
      // only relevant if editor is set to "input"
      // keybindings: {
      //   //@ts-ignore
      //   navUp: ["ctrl + shift + k", 38],
      //   //@ts-ignore
      //   navDown: ["ctrl + shift + j", 40],
      //   //@ts-ignore
      //   navLeft: ["ctrl + shift + h", 37],
      //   //@ts-ignore
      //   navRight: ["ctrl + shift + l", 39],
      // },
    });
  });

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
      <div id="results-table"></div>
    </div>
  );
};
