import { For } from "solid-js"
import { titleCase } from "../../utils/formatters"
const THEMES = ["light", "dark", "aqua", "synthwave", "dracula", "night", "cupcake"] as const;
import { onMount } from 'solid-js'
import { t } from "i18next";

const ThemeSwitch = () => {
  onMount(async () => {
    const theme = localStorage.getItem("theme") || "dark"
    document.documentElement.dataset.theme = theme
  })

  const select = (theme: typeof THEMES[number]) => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }

  return (
    <div class="dropdown dropdown-left">
      <label tabindex="0" class="m-1 btn btn-xs">{t('components.theme_switch.theme')}</label>
      <ul tabindex="0" class="p-2 shadow menu dropdown-content  z-[1] bg-base-100 rounded-box w-52">
        <For each={THEMES}>
          {(theme) => <li class="py-1"><a onClick={() => select(theme)}>{titleCase(theme)}</a></li>}
        </For>
      </ul>
    </div>
  )
}

export default ThemeSwitch
