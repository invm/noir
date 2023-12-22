import { For } from "solid-js";
import { titleCase } from "../../utils/formatters";
const THEMES = [
  "retro",
  "forest",
  "autumn",
  "garden",
  "business",
  "synthwave",
  "dracula",
  "dark",
  "night",
  "cupcake",
] as const;
import { t } from "i18next";

export const ThemeSwitch = () => {
  const select = (theme: (typeof THEMES)[number]) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  };

  return (
    <div class="dropdown dropdown-end">
      <label id="theme-switch" tabindex="0" class="btn btn-sm btn-primary">
        {t('theme_switch.theme')}
      </label>
      <ul
        tabindex={0}
        class="shadow menu dropdown-content z-[1]
          bg-base-100 rounded-box w-52"
      >
        <For each={THEMES}>
          {(theme) => (
            <li class="py-1">
              <button onClick={() => select(theme)}>{titleCase(theme)}</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};
