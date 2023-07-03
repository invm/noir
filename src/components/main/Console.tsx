import Split from 'split.js'
import { onMount } from "solid-js"

export const Console = () => {
  onMount(() => {
    Split(['#sidebar', '#main'], {
      sizes: [25, 75],
      minSize: [300, 500],
      maxSize: [500, 1000],
      expandToMin: true,
    })
    Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 200],
      direction: 'vertical',
    })
  })
  return (
    <div class="w-full h-full">
      <div class="flex w-full h-full">
        <div id="sidebar" class="bg-red-300 h-full"></div>
        <div id="main" class="flex flex-col bg-lime-500 h-full">
          <div id="query" class="bg-indigo-500"></div>
          <div id="results" class="bg-blue-500"></div>
        </div>
      </div>
    </div>
  )
}

