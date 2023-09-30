import { Row } from "interfaces";
import { createEffect } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { debounce } from "utils/utils";

export const ResultsTable = (props: { rows: Row[] }) => {
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
          action: function(_e, row) {
            // @ts-ignore
            const data = { ...row._row.data };
            for (const key in data) {
              if (data[key].startsWith('{"')) {
                data[key] = JSON.parse(data[key]);
              }
            }

            const div = document.getElementById("json-data");
            div!.innerHTML = JSON.stringify(data, null, 4);
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

  const search = (input: string) => {
    if (input === "") return;
    const pre = document.getElementById("json-data");
    const special = /[\\[{().+*?|^$]/g;
    if (special.test(input)) input = input.replace(special, "\\$&");
    const regExp = new RegExp(input, "gi");
    const html = pre?.textContent?.replace(regExp, `<mark>$&</mark>`);
    pre!.innerHTML = html + "";
  };

  return (
    <>
      <dialog id="my_modal_1" class="modal">
        <div class="modal-box">
          <div class="flex items-center mb-6">
            <input
              type="text"
              placeholder="Search"
              onkeydown={debounce((e: any) => search(e.target.value), 200)}
              class="input input-bordered input-sm w-full max-w-xs"
            />
          </div>
          <div>
            <pre id="json-data"></pre>
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
