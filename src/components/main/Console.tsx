import Split from 'split.js'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { ConnectionConfig, DbSchema } from '../../interfaces'
import { Sidebar } from '../Connections/Console/Sidebar'
import { QueryTextArea } from '../Connections/Console/QueryTextArea'
import { ResultsArea } from '../Connections/Console/ResultsArea'
import { AddIcon, CloseIcon } from '../UI/Icons'
import { createStore } from 'solid-js/store'
import { t } from '../../utils/i18n'
import { Store } from "tauri-plugin-store-api";

const store = new Store(".console.dat");

type QueryTab = {
  query: string
}

export const Console = (props: { schema: DbSchema, connection: ConnectionConfig }) => {
  // TODO: remove from local storage when parent tab is deleted
  const CONNECTION_STORE_STORAGE_KEY = '_connection:' + props.connection.id
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

  createEffect(() => {
    const s = Split(['#sidebar', '#main'], {
      sizes: [20, 80],
      minSize: [100, 200],
      maxSize: [400, Infinity],
      gutterSize: 12,
    })
    const q = Split(['#query', '#results'], {
      sizes: [40, 60],
      minSize: [100, 200],
      direction: 'vertical',
      gutterSize: 8,
    })
    onCleanup(() => {
      s.destroy()
      q.destroy()
    })
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

  return (
    <div class="w-full h-full bg-base-300">
      <div class="flex w-full h-full">
        <div id="sidebar" class="h-full">
          <div class="bg-base-100 w-full h-full rounded-tr-lg">
            <Sidebar schema={props.schema} />
          </div>
        </div>
        <div id="main" class="flex flex-col h-full">
          <div id="query" class="bg-base-300 rounded-bl-lg">
            <div class="bg-base-100 w-full h-full flex flex-col rounded-l-lg">
              <div class="bg-base-300 tabs rounded-none gap-1">
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
          <div id="results" class="bg-base-200 rounded-tl-lg p-3">
            <ResultsArea />
          </div>
        </div>
      </div>
    </div>
  )
}

