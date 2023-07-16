import { createSignal, For, Match, onMount, Show, Switch } from "solid-js"
import { createStore } from 'solid-js/store'
import { Store } from "tauri-plugin-store-api";
import { useAppSelector } from "services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";
import { QueryTab } from "./QueryTab/QueryTab";
import { TableStructureTab } from "./TableStructureTab";

const store = new Store(".console.dat");

const ContentComponent = {
  QueryTab: 'QueryTab',
  TableStructureTab: 'TableStructureTab'
} as const;

type ContentComponentKeys = keyof typeof ContentComponent

type ContentTab = {
  query?: string
  key: ContentComponentKeys
}

export const Content = () => {
  const { tabsService: { tabsStore: { activeTab: { connection } } } } = useAppSelector()
  // TODO: remove from local storage when parent tab is deleted
  const CONNECTION_STORE_STORAGE_KEY = '_connection:' + connection.id
  const [activeTabIndex, setActiveTabIndex] = createSignal(0)
  const [activeTab, setActiveTab] = createStore<ContentTab>({ query: '', key: ContentComponent.QueryTab })
  const [tabs, setTabs] = createStore<ContentTab[]>([])

  onMount(async () => {
    const tabStr = await store.get(CONNECTION_STORE_STORAGE_KEY)
    if (!tabStr) {
      setTabs(() => [{ query: '', key: ContentComponent.QueryTab }])
      return;
    }
    setTabs(() => tabStr as ContentTab[])
  })

  const persistState = async () => {
    await store.set(CONNECTION_STORE_STORAGE_KEY, tabs);
    await store.save();
  }

  const addTab = async () => {
    setTabs([...tabs, { query: '', key: ContentComponent.QueryTab }])
    setActiveTab({ query: '', key: ContentComponent.QueryTab })
    setActiveTabIndex(tabs.length - 1)
    await persistState()
  }

  const updateQueryText = async (query: string) => {
    setTabs([...tabs.map((t, i) => i === activeTabIndex() ? { ...t, query } : t)])
    await persistState()
  }

  const closeTab = async (idx: number) => {
    if (!idx) return;
    setTabs(tabs.filter((_t, i) => i !== idx));
    setActiveTabIndex(0)
  }

  return (
    <div class="flex flex-col h-full">
      <div class="bg-base-300 tabs gap-1">
        <For each={tabs}>
          {(_tab, idx) =>
            <div onClick={() => setActiveTabIndex(idx())} class="tab py-2 tab-md tab-lifted"
              classList={{ 'tab-active': activeTabIndex() === idx() }}
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
      <div class="flex-1">
        <Switch>
          <Match when={activeTab.key === ContentComponent.QueryTab}>
            <QueryTab query={activeTab.query ?? ''} updateQueryText={updateQueryText} />
          </Match>
          <Match when={activeTab.key === ContentComponent.TableStructureTab}>
            <TableStructureTab />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
