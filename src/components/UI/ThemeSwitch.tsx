import { For, Show } from "solid-js";
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
import { useAppSelector } from "services/Context";

export const ThemeSwitch = () => {
  const {
    appService: { appStore },
  } = useAppSelector();

  const select = (theme: (typeof THEMES)[number]) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  };

  return (
    <Show when={appStore.showThemeSwitcher}>
      <div class="dropdown dropdown-left">
        <label id="theme-switch" tabindex="0" class="m-1 btn btn-xs">
          {t("components.theme_switch.theme")}
        </label>
        <ul
          tabindex={0}
          class="p-2 shadow menu dropdown-content  z-[1]
          bg-base-100 rounded-box w-52"
        >
          <For each={THEMES}>
            {(theme) => (
              <li class="py-1">
                <button onClick={() => select(theme)}>
                  {titleCase(theme)}
                </button>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  );
};
