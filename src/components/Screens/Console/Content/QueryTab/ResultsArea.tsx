import { Table } from "components/UI"
import { ContentTabData } from "services/ConnectionTabs"
import { useAppSelector } from "services/Context"
import { createEffect, createSignal } from "solid-js"

export const ResultsArea = () => {
  const { connectionsService: { getActiveContentTab } } = useAppSelector()
  const [data, setData] = createSignal<Record<string, any>[]>([])

  createEffect(() => {
    const tabledata = (getActiveContentTab().data as ContentTabData['QueryTab']).results;
    if (!tabledata.length) return;
    setData(tabledata)
  });


  return (
    <div class="p-3 h-full">
      <div class="text-xs font-bold text-primary">Results</div>
      <div class="overflow-hidden flex w-full h-full">
        <Table data={data()} />
      </div>
    </div>
  )
}
