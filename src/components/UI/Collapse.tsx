import { createSignal, JSXElement } from "solid-js"

export const Collapse = (props: { title: string, children: JSXElement }) => {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="w-full">
      <div onClick={() => setOpen(!open())} class="collapse rounded-sm text-sm font-small pointer">
        {props.title}
      </div>
      {open() && props.children}
    </div>
  )
}
