import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { createStore } from 'solid-js/store'
import { Store } from "tauri-plugin-store-api";
import Split from "split.js"
import { QueryTextArea } from "./QueryTextArea";
import { ResultsArea } from "./ResultsArea";
import { useAppSelector } from "../../services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";

const store = new Store(".console.dat");

type QueryTab = {
  query: string
}

const Content = () => {
  const { tabsService: { tabsStore: { activeTab: { props: { connection } } } } } = useAppSelector()
  // TODO: remove from local storage when parent tab is deleted
  const CONNECTION_STORE_STORAGE_KEY = '_connection:' + connection.id
  const [activeTab, setActiveTab] = createSignal(0)
  const [tabs, setTabs] = createStore<QueryTab[]>([])

  onMount(async () => {
    const tabStr = await store.get(CONNECTION_STORE_STORAGE_KEY)
    if (!tabStr) {
      setTabs(() => [{ query: '' }])
      return;
    }
    setTabs(() => tabStr as QueryTab[])
  })
  const persistState = async () => {
    await store.set(CONNECTION_STORE_STORAGE_KEY, tabs);
    await store.save();
  }

  const addTab = async () => {
    setTabs([...tabs, { query: '' }])
    setActiveTab(tabs.length - 1)
    await persistState()
  }

  const updateQueryText = async (query: string) => {
    setTabs([...tabs.map((t, i) => i === activeTab() ? { ...t, query } : t)])
    await persistState()
  }

  const removeTab = (idx: number) => {
    if (idx <= 0) return;
    setActiveTab(0)
    setTabs(tabs.filter((_t, i) => i !== idx));
  }

  const closeTab = async (id: number) => {
    if (!id) return;
    removeTab(id)
    setActiveTab(0)
  }

  createEffect(() => {
    const q = Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 200],
      direction: 'vertical',
      gutterSize: 8,
    })
    onCleanup(() => {
      q.destroy()
    })
  })

  return (
    <div class="flex flex-col h-full">
      <div id="query">
        <div class="bg-base-100 w-full h-full flex flex-col">
          <div class="bg-base-300 tabs gap-1">
            <For each={tabs}>
              {(_tab, idx) =>
                <div onClick={() => setActiveTab(idx())} class="tab py-2 tab-md tab-lifted"
                  classList={{ 'tab-active': activeTab() === idx() }}
                >{t('components.console.query')} #{idx() + 1}
                  <Show when={idx() > 0}>
                    <button onClick={() => closeTab(idx())} class="pl-2 mb-1">
                      <CloseIcon />
                    </button>
                  </Show>
                </div>
              }
            </For>
            <div onClick={() => addTab()} class="tab py-2 tab-sm tab-lifted tab-active" ><AddIcon /></div>
          </div>
          <QueryTextArea query={tabs[activeTab()]?.query} {...{ updateQueryText }} />
        </div>
      </div>
      <div id="results" class="bg-base-200 p-3">
        <ResultsArea />
      </div>
    </div>
  )
}

export default Content
