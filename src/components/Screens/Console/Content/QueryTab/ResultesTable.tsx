import { Row } from "interfaces";
import { createEffect, createSignal } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import renderjson from "renderjson";

export const ResultsTable = (props: { rows: Row[] }) => {
  const [modalData, setModalData] = createSignal("");
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
      paginationSize: 20,
      height: "100%",
      paginationCounter: "rows",
      debugInvalidOptions: false,
      rowContextMenu: [
        {
          label: "Show row in JSON",
          action: function(e, column) {
            renderjson.set_show_to_level(10);
            // @ts-ignore
            setModalData(column._row.data);
            // @ts-ignore
            document.getElementById("my_modal_1").showModal();
          },
        },
        {
          label: "Copy row to clipboard",
          action: function(e, column) {
            // @ts-ignore
            navigator.clipboard.writeText(JSON.stringify(column._row.data));
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
        <div class="modal-box">
          <h3 class="font-bold text-lg">Hello!</h3>
          <div>{renderjson(modalData())}</div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div id="results-table"></div>
    </>
  );
};
