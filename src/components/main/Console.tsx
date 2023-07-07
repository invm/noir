import Split from 'split.js'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { ConnectionConfig } from '../../interfaces'
import { Sidebar } from '../Connections/Console/Sidebar'
import { QueryTextArea } from '../Connections/Console/QueryTextArea'
import { ResultsArea } from '../Connections/Console/ResultsArea'
import { AddIcon, CloseIcon } from '../UI/Icons'
import { createStore } from 'solid-js/store'
import { t } from '../../utils/i18n'

let TIMEOUT: NodeJS.Timeout | null = null

export const Console = (props: { connection: ConnectionConfig }) => {
  // TODO: remove from local storage when parent tab is deleted
  const CONNECTION_STORE_STORAGE_KEY = '_connection:' + props.connection.id
  const [activeTab, setActiveTab] = createSignal(0)
  const [tabs, setTabs] = createStore([
    { query: 'select 1 + 1' },
    { query: 'select * from users;' },
  ])

  onMount(() => {
    const tabStr = localStorage.getItem(CONNECTION_STORE_STORAGE_KEY)
    if (!tabStr) return
    const res = JSON.parse(tabStr)
    setTabs(() => res)
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

  const updateLocalStorageTimeout = () => {
    TIMEOUT && clearTimeout(TIMEOUT)
    TIMEOUT = setTimeout(() => {
      console.log('updateLocalStorageTimeout');
      localStorage.setItem(CONNECTION_STORE_STORAGE_KEY, JSON.stringify(tabs))
    }, 2000)
  }

  const addTab = () => {
    setTabs([...tabs, { query: '' }])
    setActiveTab(tabs.length - 1)
  }

  const updateQueryText = (query: string) => {
    setTabs([...tabs.map((t, i) => i === activeTab() ? { ...t, query } : t)])
    updateLocalStorageTimeout()
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
    console.log(tabs, activeTab());
    console.log(tabs[activeTab()]?.query);
  })


  return (
    <div class="w-full h-full bg-base-300">
      <div class="flex w-full h-full">
        <div id="sidebar" class="h-full">
          <div class="bg-base-100 w-full h-full rounded-tr-lg">
            <Sidebar />
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

