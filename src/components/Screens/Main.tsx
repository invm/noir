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

export const Main = () => {
  const {
    app: { setComponent, component },
    connections: { removeConnectionTab, store, setStore },
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
              setStore('idx', -1);
            }}
            class="tab tab-md"
            tabIndex={0}
            classList={{ 'tab-active': store.idx === -1 }}>
            <span class="text-md font-bold">
              <HomeIcon />
            </span>
          </button>
          <For each={store.tabs}>
            {(tab, idx) => (
              <div class="flex items-center">
                <button
                  onClick={() => {
                    setComponent(0);
                    setStore('idx', idx());
                  }}
                  class="tab tab-md pt-1"
                  classList={{
                    'tab-active': store.idx === idx(),
                  }}
                  tabindex={0}>
                  <span class="text-md font-bold">{tab.label}</span>
                </button>
                <div class="w-8">
                  <Show when={store.idx === idx()}>
                    <button
                      class="btn btn-xs btn-ghost p-1 ml-2"
                      tabindex={0}
                      onClick={() => handleCloseConnection(tab.id!)}>
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
          <div class="tooltip tooltip-primary tooltip-bottom px-3" data-tip={t('settings.read_docs')}>
            <a href="https://noir.github.io" target="_blank" class="btn btn-square btn-ghost btn-sm">
              <QuestionMark />
            </a>
          </div>
          <div class="tooltip tooltip-primary tooltip-bottom px-3" data-tip={t('settings.settings')}>
            <button class="btn btn-square btn-ghost btn-sm" onClick={() => setComponent((s) => (s === 1 ? 0 : 1))}>
              <Cog />
            </button>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden flex">
        <Switch>
          <Match when={component() === 1}>
            <Settings />
          </Match>
          <Match when={!component()}>
            <Switch>
              <Match when={store.idx === -1}>
                <Home />
              </Match>
              <Match when={store.idx >= 0}>
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
