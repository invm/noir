import './utils/i18n';
import { useAppSelector } from './services/Context';
import { Alerts } from './components/UI';
import { For } from 'solid-js';

function App() {
  const { tabsService: { tabsStore, setActiveTab, removeTab } } = useAppSelector()

  const closeTab = async (id: string) => {
    await removeTab(id)
    setActiveTab(1)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 bg-base-300 tabs tabs-boxed rounded-none gap-2">
        <For each={tabsStore.tabs}>
          {(tab, idx) =>
            <div class="group flex items-center">
              <div onClick={() => setActiveTab(idx() + 1)} class="tab tab-md "
                classList={{ 'tab-active': tabsStore.activeTab === idx() + 1, }}
              ><span class="">{tab.label}</span>               </div>
              {idx() + 1 !== 1 && <button onClick={() => closeTab(tab.id!)} class="hidden group-hover:block pl-2 mb-1">
                <svg class="w-2.5 h-2.5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="m9.414 8 5.293-5.293a1 1 0 1 0-1.414-1.414L8 6.586 2.707 1.293a1 1 0 0 0-1.414 1.414L6.586 8l-5.293 5.293a1 1 0 1 0 1.414 1.414L8 9.414l5.293 5.293a1 1 0 0 0 1.414-1.414L9.414 8Z" />
                </svg>
              </button>}

            </div>

          }
        </For>
      </div>
      <div class="h-full">
        <For each={tabsStore.tabs}>
          {(tab, idx) =>
            <div class="h-full" classList={{ 'hidden': tabsStore.activeTab !== idx() + 1, }}>
              {tab.component!()}
            </div>
          }
        </For>
      </div>
      <Alerts />
    </div>
  );
}

export default App;
