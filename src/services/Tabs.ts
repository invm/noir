import { createStore } from "solid-js/store"
import { ConnectionConfig, DbSchema } from "../interfaces";
import { onMount } from "solid-js";
import { Store } from "tauri-plugin-store-api";

const store = new Store(".tabs.dat");

type ContentTab = {
  active: boolean,
  label: string,
  data: any
}

type Tab = {
  label: string,
  id: string,
  schema: DbSchema,
  connection: ConnectionConfig
  contentTabs: ContentTab[]
}

type TabStore = {
  tabs: Tab[],
  activeTabIndex: number,
  activeTab: Tab
}

const EMPTY_TAB = {
  label: '',
  id: '',
  schema: { db_name: { col_name: {} } },
  connection: {} as ConnectionConfig,
  contentTabs: []
}

const _tabsStore = createStore<TabStore>({
  tabs: [],
  activeTabIndex: 0,
  activeTab: EMPTY_TAB
});

const TAB_STORE_STORAGE_KEY = '_tabs'

export const TabsService = () => {
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
    if (tabsStore.tabs.find(t => t.id === tab.id)) return;
    setTabsStore('tabs', tabsStore.tabs.concat(tab))
    setTabsStore('activeTab', tab)
    const idx = tabsStore.tabs.length;
    setTabsStore('activeTabIndex', idx)
    await updateStore(tabsStore)
  }

  const removeTab = async (id: string) => {
    setTabsStore('tabs', tabsStore.tabs.filter((t) => t.id !== id));
    setTabsStore('activeTab', EMPTY_TAB)
    setTabsStore('activeTabIndex', 0)
    await updateStore(tabsStore)
  }

  const setActiveTab = async (idx: number) => {
    if (idx > 0) {
      const tabs = tabsStore.tabs
      tabs[tabsStore.activeTabIndex] = tabsStore.activeTab
      setTabsStore('tabs', tabs);
      const tab = tabsStore.tabs[idx - 1]
      setTabsStore('activeTab', tab)
    }
    setTabsStore('activeTabIndex', idx)
    await updateStore(tabsStore)
  }

  const clearStore = async () => {
    await store.clear();
  }

  const updateActiveTabQuery = (query: string) => {
    const activeTab = tabsStore.activeTab
    const activeContentTabIdx = activeTab.contentTabs.indexOf(t => t.active)
    activeTab.contentTabs[activeContentTabIdx].data.query = query
    setTabsStore('activeTab', activeTab)
  }

  return { tabsStore, addTab, removeTab, setActiveTab, clearStore }
}

