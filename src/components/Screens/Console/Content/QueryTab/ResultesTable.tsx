import { Row } from "interfaces";
import { createEffect } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";

export const ResultsTable = (props: { rows: Row[] }) => {
  createEffect(() => {
    let columns: { title: string; field: string; resizeable: boolean }[] = [];
    if (props.rows.length) {
      columns = Object.keys(props.rows[0]).map((k) => ({
        title: k,
        field: k,
        resizeable: true,
        // editor: 'input' as const,
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
    });
  });

  return <div id="results-table"></div>;
};
