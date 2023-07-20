import { ContentTabData } from "services/ConnectionTabs"
import { useAppSelector } from "services/Context"
import { createEffect } from "solid-js"
import { Tabulator } from "tabulator-tables"

export const ResultsArea = () => {
  const { connectionsService: { getActiveContentTab } } = useAppSelector()

  createEffect(() => {
    const tabledata = (getActiveContentTab().data as ContentTabData['QueryTab']).results;
    console.log({ tabledata })
    if (!tabledata.length) return;
    const columns = Object.keys(tabledata[0]).map((k) => ({ title: k, field: k }))
    console.log(columns, tabledata)
    var table = new Tabulator("#example-table", {
      data: tabledata,           //load row data from array
      columns
    });
  })


  return (
    <div class="p-3">
      <div class="text-xs font-bold text-primary">Results</div>
      <div class="overflow-x-auto w-full h-full bg-red-500">
        <div id="example-table"></div>
      </div>
    </div>

  )
}
