import { Alerts } from 'components/UI';
import { invoke } from '@tauri-apps/api';
import { ThemeSwitch } from 'components/UI/ThemeSwitch';
import { CloseIcon, HomeIcon, QuestionMark } from 'components/UI/Icons';
import { useAppSelector } from 'services/Context';
import { For, Match, Show, Switch } from 'solid-js';
import { Console } from './Console/Console';
import { Home } from './Home/Home';
import { Settings } from './Settings/Settings';
import { t } from 'utils/i18n';

export const Main = () => {
  const {
    app: { setComponent, component },
    connections: { removeConnectionTab, connectionStore, setConnectionStore },
  } = useAppSelector();

  const handleCloseConnection = async (id: string) => {
    await invoke<string>('disconnect', { id });
    await removeConnectionTab(id);
  };

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 bg-base-300 rounded-none gap-2 flex justify-between items-center">
        <div class="tabs tabs-boxed gap-2">
          <button
            onClick={() => {
              setComponent(0);
              setConnectionStore('idx', 0);
            }}
            class="tab tab-md"
            tabIndex={0}
            classList={{ 'tab-active': connectionStore.idx === 0 }}>
            <span class="text-md font-bold">
              <HomeIcon />
            </span>
          </button>
          <For each={connectionStore.tabs}>
            {(tab, idx) => (
              <div class="flex items-center">
                <button
                  onClick={() => {
                    setComponent(0);
                    setConnectionStore('idx', idx() + 1);
                  }}
                  class="tab tab-md pt-1"
                  classList={{
                    'tab-active': connectionStore.idx === idx() + 1,
                  }}
                  tabindex={0}>
                  <span class="text-md font-bold">{tab.label}</span>
                </button>
                <Show when={connectionStore.idx === idx() + 1}>
                  <button tabindex={0} onClick={() => handleCloseConnection(tab.id!)} class="ml-2">
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
        <div class="flex items-center py-2">
          <ThemeSwitch />
          <Show when={connectionStore.idx !== 0}>
            <div class="tooltip tooltip-primary tooltip-bottom px-3" data-tip={t('settings.settings')}>
              <button class="btn btn-square btn-ghost btn-sm" onClick={() => setComponent((s) => (s === 1 ? 0 : 1))}>
                <QuestionMark />
              </button>
            </div>
          </Show>
        </div>
      </div>
      <div class="flex-1 overflow-hidden flex">
        <Switch>
          <Match when={component() === 1}>
            <Settings />
          </Match>
          <Match when={!component()}>
            <Switch>
              <Match when={connectionStore.idx === 0}>
                <Home />
              </Match>
              <Match when={connectionStore.idx !== 0}>
                <Console />
              </Match>
            </Switch>
          </Match>
        </Switch>
      </div>
      <Alerts />
    </div>
  );
};
