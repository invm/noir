import { createEffect, createSignal } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { search } from "@codemirror/search";
import { basicSetup, EditorView } from "codemirror";
import { json } from "@codemirror/lang-json";
import {
  createCodeMirror,
  createEditorControlledValue,
} from "solid-codemirror";
import { Pagination } from "./components/Pagination";
import { useAppSelector } from "services/Context";

const parseObjRecursive = (obj: unknown): Record<string, unknown | unknown[]> | null | unknown => {
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(parseObjRecursive);
    } else if (obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, parseObjRecursive(v)])
      );
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
    connections: { queryIdx },
  } = useAppSelector();
  const [code, setCode] = createSignal("");
  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
  });
  const [table, setTable] = createSignal<Tabulator | null>(null);
  createEditorControlledValue(editorView, code);
  createExtension(() => search());
  createExtension(dracula);
  createExtension(basicSetup);
  createExtension(json);

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  createEffect(() => {
    console.log(queryIdx);
    // let columns: { title: string; field: string; resizeable: boolean }[] = [];
    // if (length) {
    //   columns = Object.keys(props.rows[0]).map((k) => ({
    //     title: k,
    //     field: k,
    //     resizeable: true,
    //     // editor: "input" as const, // this will make the whole table navigable
    //   }));
    // }
    //
    // const _table = new Tabulator("#results-table", {
    //   data: props.rows,
    //   columns,
    //   columnDefaults: {
    //     title: "",
    //     width: 350,
    //   },
    //   layout: "fitDataStretch",
    //   autoResize: true,
    //   clipboard: true,
    //   pagination: false,
    //   paginationSize: paginationSize(),
    //   height: "100%",
    //   paginationCounter: "rows",
    //   debugInvalidOptions: false,
    //   rowContextMenu: [
    //     {
    //       label: "Show row in JSON",
    //       action: function(_e, row) {
    //         // @ts-ignore
    //         const data = parseObjRecursive(row._row.data);
    //         setCode(JSON.stringify(data, null, 4));
    //         // @ts-ignore
    //         document.getElementById("my_modal_1").showModal();
    //       },
    //     },
    //     {
    //       label: "Copy row to clipboard",
    //       action: function(_e, row) {
    //         // @ts-ignore
    //         navigator.clipboard.writeText(JSON.stringify(row._row.data));
    //       },
    //     },
    //     {
    //       separator: true,
    //     },
    //   ],
    //   // only relevant if editor is set to "input"
    //   // keybindings: {
    //   //   //@ts-ignore
    //   //   navUp: ["ctrl + shift + k", 38],
    //   //   //@ts-ignore
    //   //   navDown: ["ctrl + shift + j", 40],
    //   //   //@ts-ignore
    //   //   navLeft: ["ctrl + shift + h", 37],
    //   //   //@ts-ignore
    //   //   navRight: ["ctrl + shift + l", 39],
    //   // },
    // });
    // setTable(_table);
  });

  return (
    <div class="flex-1 flex flex-col">
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
      <Pagination table={table()} />
      <div class="flex-1 bg-red-200">
        <div id="results-table">
          <div id="loading-overlay"></div>
        </div>
      </div>
    </div>
  );
};
