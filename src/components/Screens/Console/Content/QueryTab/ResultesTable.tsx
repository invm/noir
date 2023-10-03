import { Row } from "interfaces";
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

const parseObjRecursive = (obj: any): Record<string, any> => {
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
      return JSON.parse(obj);
    } catch (e) {
      return obj;
    }
  }
};

export const ResultsTable = (props: { rows: Row[] }) => {
  const [code, setCode] = createSignal("");
  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
  });
  const [paginationSize] = createSignal(20);
  createEditorControlledValue(editorView, code);
  createExtension(() => search());
  createExtension(dracula);
  createExtension(basicSetup);
  createExtension(json);

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  createEffect(() => {
    let columns: { title: string; field: string; resizeable: boolean }[] = [];
    if (props.rows.length) {
      columns = Object.keys(props.rows[0]).map((k) => ({
        title: k,
        field: k,
        resizeable: true,
        // editor: "input" as const, // this will make the whole table navigable
      }));
    }

    new Tabulator("#results-table", {
      data: props.rows,
      columns,
      columnDefaults: {
        title: "",
        width: 350,
      },
      layout: "fitDataStretch",
      autoResize: true,
      clipboard: true,
      pagination: true,
      paginationSize: paginationSize(),
      height: "100%",
      paginationCounter: "rows",
      debugInvalidOptions: false,
      rowContextMenu: [
        {
          label: "Show row in JSON",
          action: function(_e, row) {
            // @ts-ignore
            const data = parseObjRecursive(row._row.data);
            setCode(JSON.stringify(data, null, 4));
            // @ts-ignore
            document.getElementById("my_modal_1").showModal();
          },
        },
        {
          label: "Copy row to clipboard",
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

  return (
    <>
      <dialog id="my_modal_1" class="modal">
        <div class="modal-box min-w-[1000px] max-h-full h-[80%]">
          <div class="h-full">
            <div ref={ref} class="h-full"/>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div id="results-table"></div>
    </>
  );
};
