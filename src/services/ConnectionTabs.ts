import { createStore } from "solid-js/store"
import { ConnectionConfig, DbSchema } from "../interfaces";
import { onMount } from "solid-js";
import { Store } from "tauri-plugin-store-api";

const store = new Store(".connections.dat");

export const ContentComponent = {
  QueryTab: 'QueryTab',
  TableStructureTab: 'TableStructureTab'
} as const;

type ContentComponentKeys = keyof typeof ContentComponent

export type ContentTab = {
  label: string,
  data: any
  key: ContentComponentKeys
}

type Tab = {
  label: string,
  id: string,
  schema: DbSchema,
  connection: ConnectionConfig,
  contentTabs: ContentTab[],
  activeTabIdx: number,
}

type TabStore = {
  connectionTabs: Tab[],
  activeConnectionTabIdx: number,
  activeConnectionTab: Tab,
}

const EMPTY_TAB = {
  label: '',
  id: '',
  schema: { db_name: { col_name: {} } },
  connection: {} as ConnectionConfig,
  contentTabs: [],
  activeTabIdx: 0,
}

const _tabsStore = createStore<TabStore>({
  connectionTabs: [],
  activeConnectionTabIdx: 0,
  activeConnectionTab: EMPTY_TAB,
});

const TAB_STORE_STORAGE_KEY = '_tabs'

export const ConnectionTabsService = () => {
  const [tabsStore, setTabsStore] = _tabsStore

  onMount(async () => {
    const tabStr = await store.get(TAB_STORE_STORAGE_KEY);
    if (!tabStr) return
    const res = JSON.parse(tabStr as string)
    setTabsStore(() => res as unknown as TabStore)
  })

  const updateStore = async (newStore: TabStore) => {
    await store.set(TAB_STORE_STORAGE_KEY, JSON.stringify(newStore));
    await store.save();
  }

  const addTab = async (tab: Tab) => {
    if (tabsStore.connectionTabs.find(t => t.id === tab.id)) return;
    setTabsStore('connectionTabs', tabsStore.connectionTabs.concat(tab))
    setTabsStore('activeConnectionTab', tab)
    const idx = tabsStore.connectionTabs.length;
    setTabsStore('activeConnectionTabIdx', idx)
    await updateStore(tabsStore)
  }

  const removeTab = async (id: string) => {
    setTabsStore('connectionTabs', tabsStore.connectionTabs.filter((t) => t.id !== id));
    setTabsStore('activeConnectionTab', EMPTY_TAB)
    setTabsStore('activeConnectionTabIdx', 0)
    await updateStore(tabsStore)
  }

  const setActiveTab = async (idx: number) => {
    if (idx > 0) {
      const tabs = tabsStore.connectionTabs
      tabs[tabsStore.activeConnectionTabIdx] = tabsStore.activeConnectionTab
      setTabsStore('connectionTabs', tabs);
      const tab = tabsStore.connectionTabs[idx - 1]
      setTabsStore('activeConnectionTab', tab)
    }
    setTabsStore('activeConnectionTabIdx', idx)
    await updateStore(tabsStore)
  }

  const clearStore = async () => {
    await store.clear();
  }

  const updateActiveContentTabData = (data: Record<string, any>) => {
    const activeTabIdx = tabsStore.activeConnectionTab.activeTabIdx;
    const activeConnectionTab = { ...tabsStore.activeConnectionTab };
    activeConnectionTab.contentTabs[activeTabIdx].data = data;
    setTabsStore('activeConnectionTab', activeConnectionTab)
  }

  const updateActiveConnectionContentTabs = (tabs: ContentTab[]) => {
    const activeConnectionTab = { ...tabsStore.activeConnectionTab };
    activeConnectionTab.contentTabs = tabs;
    console.log(activeConnectionTab.contentTabs)
    setTabsStore('activeConnectionTab', activeConnectionTab)
  }

  const updateActiveConnectionActiveContentTabIdx = (idx: number) => {
    const activeConnectionTab = { ...tabsStore.activeConnectionTab }
    activeConnectionTab.activeTabIdx = idx
    setTabsStore('activeConnectionTab', activeConnectionTab)
  }


  return {
    tabsStore,
    addTab,
    removeTab,
    setActiveTab,
    clearStore,
    updateActiveConnectionActiveContentTabIdx,
    updateActiveConnectionContentTabs,
    updateActiveContentTabData,
  }
}

