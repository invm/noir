import { createSignal, JSXElement } from "solid-js"
import { ChevronDown, ChevronRight } from "./Icons"

export const Collapse = (props: { title: string, children: JSXElement }) => {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="w-full">
      <div onClick={() => setOpen(!open())} class="collapse flex items-center rounded-sm text-sm font-semibold pointer border-b-2 border-base-300">
        <label class={`swap text-6xl ${open() ? 'swap-active' : ''}`}>
          <svg class="w-2 h-2 swap-off" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
          </svg>
          <svg class="w-2 h-2 swap-on" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
          </svg>
        </label>
        <span class="ml-2">
          {props.title}
        </span>
      </div>
      {open() && props.children}
    </div>
  )
}
