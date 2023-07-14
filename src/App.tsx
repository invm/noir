import './utils/i18n';
import { useAppSelector } from './services/Context';
import { Alerts } from './components/UI';
import { For, Show } from 'solid-js';
import { CloseIcon } from './components/UI/Icons';
import ThemeSwitch from './components/UI/ThemeSwitch';

function App() {
  const { tabsService: { tabsStore, setActiveTab, removeTab, clearStore } } = useAppSelector()

  const closeTab = async (id: string) => {
    await removeTab(id)
    setActiveTab(1)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pb-2 bg-base-300 tabs tabs-boxed rounded-none gap-2 flex justify-between items-center">
        <div class="flex items-center">
          <For each={tabsStore.tabs}>
            {(tab, idx) =>
              <div class="flex items-center">
                <div onClick={() => setActiveTab(idx() + 1)} class="tab tab-md"
                  classList={{ 'tab-active': tabsStore.activeTab === idx() + 1, }}
                ><span class="text-md font-bold">{tab.label}</span></div>
                <Show when={tabsStore.activeTab === idx() + 1 && idx() + 1 !== 1}>
                  <button onClick={() => closeTab(tab.id!)} class="pl-2 mb-1">
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            }
          </For>
        </div>
        <div>
          {/*
          <button onClick={async () => await clearStore()}>Reset store</button>
          */}
          <ThemeSwitch />
        </div>
      </div>
      <div class="h-full">
        <For each={tabsStore.tabs}>
          {(tab, idx) => {
            const Component = tab.component
            return <Show when={tabsStore.activeTab === idx() + 1}><div class="h-full">
              {Component && <Component {...tab.props} />}
            </div></Show>
          }}
        </For>
      </div>
      <Alerts />
    </div >
  );
}

export default App;
