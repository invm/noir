import { For } from "solid-js"
import { titleCase } from "../../utils/formatters"
const THEMES = ["light", "dark", "aqua", "synthwave", "dracula", "night", "cupcake"]
import { onMount } from 'solid-js'
import { themeChange } from 'theme-change'

const ThemeSwitch = () => {

  onMount(async () => {
    themeChange();
  })
  return (
    <details class="dropdown dropdown-left">
      <summary class="m-1 btn btn-xs">Theme</summary>
      <ul class="p-2 shadow menu dropdown-content  z-[1] bg-base-100 rounded-box w-52">
        <For each={THEMES}>
          {(theme) => <li data-toggle-theme={theme} class="py-1">{titleCase(theme)}</li>}
        </For>
      </ul>
    </details>
  )
}

export default ThemeSwitch
