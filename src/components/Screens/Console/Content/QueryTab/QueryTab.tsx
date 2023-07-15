import { createEffect, onCleanup } from "solid-js"
import Split from "split.js"
import { QueryTextArea } from "./QueryTextArea"
import { ResultsArea } from "./ResultsArea"

export const QueryTab = (props: { query: string, updateQueryText: (s: string) => void }) => {

  createEffect(() => {
    const q = Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 200],
      direction: 'vertical',
      gutterSize: 8,
    })
    onCleanup(() => {
      q.destroy()
    })
  })

  return (
    <div class="flex flex-col h-full">
      <div id="query">
        <QueryTextArea query={props.query} updateQueryText={props.updateQueryText} />
      </div>
      <div id="results" class="bg-base-200 p-3">
        <ResultsArea />
      </div>
    </div >
  )
}
