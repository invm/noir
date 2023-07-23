import { createEffect, onCleanup } from "solid-js"
import Split from "split.js"
import { QueryTextArea } from "./QueryTextArea"
import { ResultsArea } from "./ResultsArea"

export const QueryTab = () => {

  createEffect(() => {
    const q = Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 400],
      direction: 'vertical',
      gutterSize: 8,
    })
    onCleanup(() => {
      q.destroy()
    })
  })

  return (
    <div class="flex flex-col h-full">
      <div id="query" class="flex max-h-[40%]">
        <QueryTextArea />
      </div>
      <div id="results" class="max-h-[60%] h-full bg-base-200 p-3 overflow-hidden">
        <ResultsArea />
      </div>
    </div >
  )
}
