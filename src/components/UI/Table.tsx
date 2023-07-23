import { createEffect, createSignal, For } from "solid-js";

export const Table = (props: { data: Record<string, any>[] }) => {
  const [columns, setColumns] = createSignal<Record<string, any>[]>([])
  const [tabledata, setTableData] = createSignal<Record<string, any>[]>([])

  createEffect(() => {
    if (!props.data.length) return;
    console.log(props.data.length)
    const columns = Object.keys(props.data[0]).map((k) => ({ title: k, field: k }))
    setColumns(columns)
    setTableData(props.data)
  });

  return (
    <div class="h-[1200px] w-full overflow-hidden">
      <div class="overflow-auto h-full">
        <table class="table table-xs table-zebra table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th></th>
              <For each={columns()}>
                {(column) => (<th>{column.title}</th>)}
              </For>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <For each={tabledata()}>
              {(row, i) => (
                <tr>
                  <th>{i() + 1}</th>
                  <For each={columns()}>
                    {(column) => (<th>{row[column.field]}</th>)}
                  </For>
                  <th>{i() + 1}</th>
                </tr>
              )}
            </For>
          </tbody>
          <tfoot>
            <tr>
              <th></th>
              <For each={columns()}>
                {(column) => (<th>{column.title}</th>)}
              </For>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
