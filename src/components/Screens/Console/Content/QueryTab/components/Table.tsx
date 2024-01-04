import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { createEffect } from 'solid-js';

import { Row } from 'interfaces';
import Keymaps from 'components/UI/Keymaps';
import { NoResults } from './NoResults';

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

export const Table = (props: { rows: Row[] }) => {
  createEffect(() => {
    let columns: TableColumn[] = [];
    // const _loaded = loaded();
    const _rows = props.rows;
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
      // placeholder: (_loaded ? <NoResults /> : <Keymaps />) as HTMLElement,
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
      // rowContextMenu: [
      //   {
      //     label: 'Show row in JSON',
      //     action: function(_e, row) {
      //       // @ts-ignore
      //       const data = parseObjRecursive(row._row.data);
      //       setCode(JSON.stringify(data, null, 4));
      //       // @ts-ignore
      //       document.getElementById('my_modal_1').showModal();
      //     },
      //   },
      //   {
      //     label: 'Copy row to clipboard as json',
      //     action: function(_e, row) {
      //       // @ts-ignore
      //       navigator.clipboard.writeText(JSON.stringify(row._row.data));
      //     },
      //   },
      //   {
      //     separator: true,
      //   },
      // ],
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
  return <div id="results-table"></div>;
};
