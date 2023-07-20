import { createStore } from "solid-js/store"
import { ConnectionConfig, DbSchema } from "../interfaces";
import { onMount } from "solid-js";
import { Store } from "tauri-plugin-store-api";
import { debounce } from "utils/utils";

const store = new Store(".connections.dat");

export const ContentComponent = {
  QueryTab: 'QueryTab',
  TableStructureTab: 'TableStructureTab'
} as const;

export const NEW_QUERY_TAB = { label: 'Query', data: { query: '', results: [] }, key: ContentComponent.QueryTab }

type ContentComponentKeys = keyof typeof ContentComponent

export type ContentTabData = {
  [ContentComponent.QueryTab]: {
    query: string,
    results: Record<string, any>[]
  },
  [ContentComponent.TableStructureTab]: {
    table: string,
    structure: Record<string, any>[]
    indices: Record<string, any>[]
    foreignKeys: Record<string, any>[]
    triggers: Record<string, any>[]
  }
}

export type ContentTab<C extends ContentComponentKeys> = {
  label: string,
  key: C,
  data: ContentTabData[C]
}

type ContentTabOption = ContentTab<'TableStructureTab'> | ContentTab<'QueryTab'>

type ConnectionTab = {
  label: string,
  id: string,
  schema: DbSchema,
  connection: ConnectionConfig,
}

const CONNECTIONS_TABS_KEY = '_conn_tabs'
const CONTENT_TABS_KEY = '_content_tabs'

const getSavedData = async (key: string, defaultValue: any = []) => {
  const str = await store.get(key);
  if (!str) return defaultValue;
  try {
    const res = JSON.parse(str as string)
    return res as unknown
  } catch (e) {
    console.log(e)
    return defaultValue
  }
}

type ConnectionStore = {
  tabs: ConnectionTab[],
  idx: number,
}

type ContentStore = {
  tabs: ContentTabOption[],
  idx: number,
}

export const ConnectionTabsService = () => {
  const [connectionStore, setConnectionStore] = createStore<ConnectionStore>({ tabs: [], idx: 0 })
  const [contentStore, setContentStore] = createStore<ContentStore>({ tabs: [], idx: 0 })

  onMount(async () => {
    const conn_tabs = await getSavedData(CONNECTIONS_TABS_KEY)
    setConnectionStore(() => conn_tabs as ConnectionStore)
    const content = await getSavedData(CONTENT_TABS_KEY)
    setContentStore(() => content as ContentStore)
  })

  const updateStore = debounce(async () => {
    await store.set(CONNECTIONS_TABS_KEY, JSON.stringify(connectionStore));
    await store.set(CONTENT_TABS_KEY, JSON.stringify(contentStore));
    await store.save();
  }, 3000)

  const addTab = async (tab: ConnectionTab) => {
    if (connectionStore.tabs.find(t => t.id === tab.id)) return;
    setConnectionStore('tabs', connectionStore.tabs.concat(tab))
    setContentStore('tabs', [NEW_QUERY_TAB])
    const idx = connectionStore.tabs.length;
    setConnectionStore('idx', idx)
    updateStore()
  }

  const removeTab = async (id: string) => {
    setConnectionStore('tabs', connectionStore.tabs.filter((t) => t.id !== id));
    setConnectionStore('idx', 0)
    updateStore()
  }

  const clearStore = async () => {
    await store.clear();
  }

  const getActiveConnection = () => {
    return connectionStore.tabs[connectionStore.idx - 1]
  }

  const getActiveContentTab = () => {
    return contentStore.tabs[contentStore.idx]
  }

  const setActiveContentQueryTabData = (data: ContentTabData['QueryTab']) => {
    const tab = getActiveContentTab()
    if (!tab) return;
    const tabs = contentStore.tabs;
    tabs[contentStore.idx].data = data;
    setContentStore('tabs', tabs);
  }

  return {
    connectionStore,
    setConnectionStore,
    contentStore,
    setContentStore,
    addTab,
    removeTab,
    clearStore,
    getActiveConnection,
    getActiveContentTab,
    setActiveContentQueryTabData,
  }
}

