import Split from 'split.js'
import { createEffect, onCleanup, onMount } from "solid-js"
import { ConnectionConfig } from '../../interfaces'
import { Sidebar } from '../Connections/Console/Sidebar'
import { QueryTextArea } from '../Connections/Console/QueryTextArea'
import { ResultsArea } from '../Connections/Console/ResultsArea'

export const Console = (_props: { connection: ConnectionConfig }) => {
  createEffect(() => {
    const s = Split(['#sidebar', '#main'], {
      sizes: [20, 80],
      minSize: [100, 200],
      maxSize: [400, Infinity],
      gutterSize: 12,
    })
    const q = Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 200],
      direction: 'vertical',
      gutterSize: 8,
    })
    onCleanup(() => {
      s.destroy()
      q.destroy()
    })
  })


  return (
    <div class="w-full h-full bg-base-300">
      <div class="flex w-full h-full">
        <div id="sidebar" class="h-full">
          <div class="bg-base-100 w-full h-full rounded-tr-lg">
            <Sidebar />
          </div>
        </div>
        <div id="main" class="flex flex-col h-full">
          <div id="query" class="bg-base-300 rounded-bl-lg">
            <div class="bg-base-100 w-full h-full rounded-l-lg">
              <QueryTextArea />
            </div>
          </div>
          <div id="results" class="bg-base-200 rounded-tl-lg p-3">
            <ResultsArea />
          </div>
        </div>
      </div>
    </div>
  )
}

