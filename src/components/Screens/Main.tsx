import { Alerts } from 'components/UI';
import { invoke } from '@tauri-apps/api';
import { CloseIcon, Cog, HomeIcon, QuestionMark } from 'components/UI/Icons';
import { useAppSelector } from 'services/Context';
import { For, Match, Show, Switch } from 'solid-js';
import { Console } from './Console/Console';
import { Home } from './Home/Home';
import { Settings } from './Settings/Settings';
import { t } from 'utils/i18n';
import { ThemeSwitch } from 'components/UI/ThemeSwitch';
import Keymaps from './Settings/Keymaps';

export const Main = () => {
  const {
    app: { screen, setScreen, toggleScreen },
    connections: { removeConnectionTab, store, setStore },
  } = useAppSelector();

  const handleCloseConnection = async (id: string) => {
    await invoke<string>('disconnect', { id });
    await removeConnectionTab(id);
    if (store.tabs.length === 0) {
      setScreen('home');
    }
  };

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 bg-base-300 rounded-none gap-2 flex justify-between items-center">
        <div class="tabs tabs-md tabs-boxed gap-2 flex">
          <button
            onClick={() => {
              setScreen('home');
              setStore('idx', 0);
            }}
            class="tab"
            tabIndex={0}
            classList={{ 'tab-active': screen() === 'home' }}
          >
            <span class="text-md font-bold">
              <HomeIcon />
            </span>
          </button>
          <For each={store.tabs}>
            {(tab, idx) => (
              <div class="flex items-center">
                <button
                  onClick={() => {
                    setScreen('console');
                    setStore('idx', idx());
                  }}
                  class="tab pt-1"
                  classList={{
                    'tab-active': screen() === 'console' && store.idx === idx(),
                  }}
                  tabindex={0}
                >
                  <span class="text-md font-bold">{tab.label}</span>
                </button>
                <div class="w-8">
                  <Show when={store.idx === idx()}>
                    <button
                      class="btn btn-xs btn-ghost p-1 ml-2"
                      tabindex={0}
                      onClick={() => handleCloseConnection(tab.id!)}
                    >
                      <CloseIcon />
                    </button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
        <div class="flex items-center py-2">
          <ThemeSwitch />
          <div
            class="tooltip tooltip-primary tooltip-bottom px-3"
            data-tip={t('settings.read_docs')}
          >
            <a
              href="https://noirdb.dev"
              target="_blank"
              class="btn btn-square btn-ghost btn-sm"
            >
              <QuestionMark />
            </a>
          </div>
          <div
            class="tooltip tooltip-primary tooltip-bottom px-3"
            data-tip={t('settings.settings')}
          >
            <button
              class="btn btn-square btn-ghost btn-sm"
              onClick={() => toggleScreen('settings')}
            >
              <Cog />
            </button>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden flex">
        <Switch>
          <Match when={screen() === 'settings'}>
            <Settings />
          </Match>
          <Match when={screen() === 'keymaps'}>
            <div class="w-full bg-base-200 py-10 overflow-y-auto">
              <Keymaps />
            </div>
          </Match>
          <Match when={screen() === 'home'}>
            <Home />
          </Match>
          <Match when={screen() === 'console'}>
            <Console />
          </Match>
        </Switch>
      </div>
      <Alerts />
    </div>
  );
};
