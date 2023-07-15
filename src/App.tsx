import './utils/i18n';
import { useAppSelector } from './services/Context';
import { Alerts } from './components/UI';
import { For, Match, Show, Switch } from 'solid-js';
import { CloseIcon } from './components/UI/Icons';
import ThemeSwitch from './components/UI/ThemeSwitch';
import { Home } from './components/main/Home';
import { Console } from './components/main/Console';

function App() {
  const { tabsService: { tabsStore, setActiveTab, removeTab, clearStore } } = useAppSelector()

  const closeTab = async (id: string) => {
    await removeTab(id)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pb-2 bg-base-300 tabs tabs-boxed rounded-none gap-2 flex justify-between items-center">
        <div class="flex items-center">
          <div class="flex items-center">
            <div onClick={() => setActiveTab(0)} class="tab tab-md"
              classList={{ 'tab-active': tabsStore.activeTabIndex === 0, }} >
              <span class="text-md font-bold">Home</span>
            </div>
          </div>
          <For each={tabsStore.tabs}>
            {(tab, idx) =>
              <div class="flex items-center">
                <div onClick={() => setActiveTab(idx() + 1)} class="tab tab-md"
                  classList={{ 'tab-active': tabsStore.activeTabIndex === idx() + 1, }}
                ><span class="text-md font-bold">{tab.label}</span></div>
                <Show when={tabsStore.activeTabIndex === idx() + 1}>
                  <button onClick={() => closeTab(tab.id!)} class="pl-2 mb-1">
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            }
          </For>
        </div>
        <div>
          <button onClick={async () => await clearStore()}>Reset store</button>
          <ThemeSwitch />
        </div>
      </div>
      <div class="h-full">
        <div class="h-full">
          <Switch>
            <Match when={tabsStore.activeTabIndex === 0}>
              <Home />
            </Match>
            <Match when={tabsStore.activeTabIndex !== 0}>
              <Console />
            </Match>
          </Switch>
        </div>
      </div>
      <Alerts />
    </div >
  );
}

export default App;
