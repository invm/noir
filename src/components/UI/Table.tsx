import { createEffect, createSignal, For } from "solid-js";
import { TabulatorFull as Tabulator } from 'tabulator-tables';

export const Table = (props: { data: Record<string, any>[] }) => {
  const [columns, setColumns] = createSignal<Record<string, any>[]>([])
  const [tabledata, setTableData] = createSignal<Record<string, any>[]>([])

  createEffect(() => {
    console.log('render')
    if (!props.data.length) return;
    const columns = Object.keys(props.data[0]).map((k) => ({ title: k, field: k }))
    setColumns(columns)
    setTableData(props.data)
    console.log(props.data, columns)

    new Tabulator('#results-table', {
      data: props.data,
      columns: columns,
      layout: "fitColumns",
      resizableColumnFit: true,
    });
  });

  return (
    <div class="">
      <div id="results-table"></div>
    </div>
  )
}
