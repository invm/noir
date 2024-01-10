import { createSignal, For, Show } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import { titleCase } from 'utils/formatters';
import { ThemeCategory, THEMES } from 'services/App';

const btnColors = {
  grid: 'btn-accent',
  ui: 'btn-primary',
  editor: 'btn-secondary',
};

export const ThemeSwitch = () => {
  const {
    app: { updateTheme },
  } = useAppSelector();

  const [checked, setChecked] = createSignal(false);

  return (
    <div class="flex items-center">
      <Show when={checked()}>
        <For each={Object.entries(THEMES)}>
          {([cat, themes]) => (
            <div class="dropdown dropdown-end">
              <label
                id="theme-switch"
                tabindex="0"
                class={`btn btn-xs ${btnColors[cat as ThemeCategory]} btn-outline mx-2`}>
                {t(`theme_switch.${cat}`)}
              </label>
              <ul
                tabindex={0}
                class="shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52 h-[300px] overflow-y-auto flex-nowrap">
                <For each={themes}>
                  {(theme) => (
                    <li class="py-1">
                      <button tabindex={1} onClick={() => updateTheme(cat as ThemeCategory, theme)}>
                        {titleCase(theme)}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          )}
        </For>
      </Show>
      <div class="tooltip tooltip-primary tooltip-bottom px-3" data-tip={t('theme_switch.themes')}>
        <div class="form-control">
          <label class="label cursor-pointer">
            <input type="checkbox" class="toggle" checked={checked()} onChange={(e) => setChecked(e.target.checked)} />
          </label>
        </div>
      </div>
    </div>
  );
};
