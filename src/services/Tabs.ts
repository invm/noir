import { createStore } from "solid-js/store"
import { ConnectionConfig, DbSchema } from "../interfaces";
import { onMount } from "solid-js";
import { Store } from "tauri-plugin-store-api";

const store = new Store(".tabs.dat");

type Tab = {
  label: string,
  id: string,
  props: {
    schema: DbSchema,
    connection: ConnectionConfig
  }
}

type TabStore = {
  tabs: Tab[],
  activeTabIndex: number,
  activeTab: Tab
}

const EMPTY_TAB = {
  label: '',
  id: '',
  props: {
    schema: {
      db_name: {
        col_name: {}
      }
    },
    connection: {} as ConnectionConfig
  }
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
      const tab = tabsStore.tabs[idx - 1]
      setTabsStore('activeTab', tab)
    }
    setTabsStore('activeTabIndex', idx)
    await updateStore(tabsStore)
  }

  const clearStore = async () => {
    await store.clear();
  }

  return { tabsStore, addTab, removeTab, setActiveTab, clearStore }
}

