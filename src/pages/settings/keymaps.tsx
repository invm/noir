import { For, JSX, Show } from 'solid-js';
import { t } from 'utils/i18n';

// this is not done with i18n because this is copied to the docs site as is
const ALL_KEYMAPS = [
  {
    category: 'Global',
    keys: [{ action: 'Show keyboard shortcuts', keys: ['F1'] }],
  },
  {
    category: 'Navigation',
    keys: [
      { action: 'Select tab', keys: ['Alt/Cmd', 'number'] },

      { action: 'Select connection tab', keys: ['Ctrl/Cmd', 'number'] },
      { action: 'Add new connection', keys: ['Ctrl/Cmd', '` (backtick)'] },
    ],
  },
  {
    category: 'Editor',
    keys: [
      { action: 'Execute query', keys: ['Ctrl', 'E/Enter'] },
      { action: 'New tab', keys: ['Ctrl/Cmd', 'T'] },
      { action: 'Close current tab', keys: ['Ctrl/Cmd', 'W'] },
      { action: 'Focus on editor', keys: ['Ctrl', 'L'] },
      { action: 'Trigger autocomplete in editor', keys: ['Ctrl', 'Space'] },
      { action: 'Format query', keys: ['Ctrl', 'Shift', 'F'] },
      { action: 'Search', keys: ['Ctrl/Cmd', 'F'] },
    ],
  },
  {
    category: 'Results table',
    keys: [
      { action: 'Navigation', keys: ['←', '↑', '→', '↓'] },
      { action: 'Navigate to start/end', keys: ['Ctrl/Cmd', '←', '→'] },
      { action: 'Navigate to top/bottom', keys: ['Ctrl/Cmd', '↑', '↓'] },
      { action: 'Next cell', keys: ['Tab'] },
      { action: 'Previous cell', keys: ['Shift', 'Tab'] },
      { action: 'Select next/previous result', keys: ['Ctrl', 'Shift', 'Q/E'] },
      { action: 'Select next/previous page', keys: ['Ctrl/Cmd', 'Shift', 'N/P'] },
      { action: 'Export as CSV', keys: ['Ctrl', 'Shift', 'C'] },
      { action: 'Export as JSON array', keys: ['Ctrl', 'Shift', 'J'] },
    ],
  },
  {
    category: 'Data tab table',
    description: 'When right-clicking on a table/view and selecting "View data", the following shortcuts are available',
    keys: [
      { action: 'Add row', keys: ['Alt/Cmd', 'N'] },
      { action: 'Save add/edit row form', keys: ['Ctrl/Cmd', 'S'] },
    ],
  },
  {
    category: 'Editor in Vim Mode',
    description: 'Most of the Vim commands are supported. The following are custom commands',
    keys: [{ action: 'Scroll autocomplete suggestions up/down', keys: ['Ctrl', 'N/P'] }],
  },
];

const CATEGORY_LIMIT = 3;

const Keymaps = (props: { short?: boolean; suffix?: JSX.Element }) => {
  const keymaps = props.short ? ALL_KEYMAPS.slice(0, CATEGORY_LIMIT) : ALL_KEYMAPS;
  return (
    <div class="flex items-center flex-col flex-1">
      <Show when={!props.suffix && !props.short}>
        <h2 class="text-2xl font-bold mt-4 text-primary pb-5">{t('keymaps.title')}</h2>
        <span class="max-w-lg font-medium text-center pb-5">{t('keymaps.description')}</span>
      </Show>
      <For each={keymaps}>
        {({ category, keys, description }) => (
          <div class="flex items-center flex-col">
            <div class="flex flex-col items-center">
              <h3 class="text-lg font-bold text-primary">{category}</h3>
              <Show when={description}>
                <span class="text-sm text-gray-500 dark:text-gray-400">{description}</span>
              </Show>
            </div>
            <div class="grid grid-cols-2">
              <div class="flex flex-col items-end pr-1">
                <For each={props.short ? keys.slice(0, 5) : keys}>
                  {({ action }) => (
                    <div class="h-[30px] flex items-center align-middle text-base-content">
                      <span class="text-md font-medium">{action}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex flex-col items-start pl-1">
                <For each={props.short ? keys.slice(0, 5) : keys}>
                  {({ keys }) => (
                    <div class="h-[30px] flex items-center">
                      <span class="flex gap-2">
                        <For each={keys}>{(key) => <kbd class="kbd kbd-xs text-base-content">{key}</kbd>}</For>
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </For>
      <div class="flex justify-center">
        <Show when={props.suffix}>{props.suffix}</Show>
      </div>
    </div>
  );
};

export default Keymaps;
