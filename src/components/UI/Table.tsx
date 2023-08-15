import { createEffect } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";

export const Table = (props: { data: Record<string, any>[] }) => {
  createEffect(() => {
    if (!props.data.length) return;
    const columns = Object.keys(props.data[0]).map((k) => ({
      title: k,
      field: k,
      resizeable: true,
    }));

    new Tabulator("#results-table", {
      data: props.data,
      columns,
      columnDefaults: {
        title: '',
        width: 350,
      },
      layout: "fitDataStretch",
      autoResize: true,
      clipboard:true,
      pagination: true,
      paginationSize: 20,
      height: "100%",
      paginationCounter: "rows",
    });
  });

  return (
    <>
      <div id="results-table"></div>
    </>
  );
};
