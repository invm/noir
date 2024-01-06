import { For } from 'solid-js';

const keymaps = [
  { action: 'Help', keys: ['F1'] },
  { action: 'Execute query', keys: ['Ctrl', 'e'] },
  { action: 'Select tab', keys: ['Meta', 'number'] },
  { action: 'New tab', keys: ['Meta', 't'] },
  { action: 'Close current tab', keys: ['Meta', 'w'] },
  { action: 'Focus on editor', keys: ['Ctrl', 'l'] },
  { action: 'Format query', keys: ['Ctrl', 'Shift', 'f'] },
  { action: 'Select next/previous result', keys: ['Ctrl', 'Shift', 'n/p'] },
  { action: 'Select next/previous page', keys: ['Ctrl', 'n/p'] },
];

const Keymaps = () => {
  return (
    <div class="flex items-center justify-center">
      <div class="flex flex-col items-end pr-1">
        <For each={keymaps}>
          {({ action }) => (
            <div class="h-[40px] flex items-center align-middle">
              <span class="text-lg font-medium">{action}</span>
            </div>
          )}
        </For>
      </div>
      <div class="flex flex-col items-start pl-1">
        <For each={keymaps}>
          {({ keys }) => (
            <div class="h-[40px] flex items-center">
              <span class="flex gap-2">
                <For each={keys}>{(key) => <kbd class="kbd kbd-sm text-base-content">{key}</kbd>}</For>
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default Keymaps;
