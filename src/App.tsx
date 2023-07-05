import './utils/i18n';
import { useAppSelector } from './services/Context';
import { Alerts } from './components/UI';
import { For, Show } from 'solid-js';
import { CloseIcon } from './components/UI/Icons';

function App() {
  const { tabsService: { tabsStore, setActiveTab, removeTab } } = useAppSelector()

  const closeTab = async (id: string) => {
    removeTab(id)
    setActiveTab(1)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pb-2 bg-base-300 tabs tabs-boxed rounded-none gap-2">
        <For each={tabsStore.tabs}>
          {(tab, idx) =>
            <div class="group flex items-center">
              <div onClick={() => setActiveTab(idx() + 1)} class="tab tab-md "
                classList={{ 'tab-active': tabsStore.activeTab === idx() + 1, }}
              ><span class="">{tab.label}</span>               </div>
              {idx() + 1 !== 1 && <button onClick={() => closeTab(tab.id!)} class="hidden group-hover:block pl-2 mb-1">
                <CloseIcon />
              </button>}
            </div>
          }
        </For>
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
    </div>
  );
}

export default App;
