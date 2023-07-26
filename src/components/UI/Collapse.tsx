import { createSignal, JSXElement } from "solid-js"
import { ChevronRight } from "./Icons"

export const Collapse = (props: { title: string, children: JSXElement }) => {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="w-full">
      <div onClick={() => setOpen(!open())} class="collapse flex items-center rounded-sm text-sm font-semibold pointer border-b-2 border-base-300">
        <ChevronRight />
        <span class="ml-2">
          {props.title}
        </span>
      </div>
      {open() && props.children}
    </div>
  )
}
