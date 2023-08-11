import { createEffect } from "solid-js";
import { TabulatorFull as Tabulator } from "tabulator-tables";

export const Table = (props: { data: Record<string, any>[] }) => {
  createEffect(() => {
    if (!props.data.length) return;
    const columns = Object.keys(props.data[0]).map((k) => ({
      title: k,
      field: k,
    }));

    new Tabulator("#results-table", {
      data: props.data,
      columns,
      layout: "fitColumns",
      autoResize: true,
      pagination: true,
      paginationSize: 30,
      height: "100%",
      paginationCounter:"rows",
    });
  });

  return (
    <>
      <div id="results-table"></div>
    </>
  );
};
