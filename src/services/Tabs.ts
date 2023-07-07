import { JSX } from "solid-js/jsx-runtime";
import { createStore } from "solid-js/store"
import { Home } from "../components/main/Home";
import { Console } from "../components/main/Console";
import { ConnectionConfig } from "../interfaces";
import { onMount } from "solid-js";
import { Store } from "tauri-plugin-store-api";

const store = new Store(".tabs.dat");


type Tab = {
  key: keyof typeof ComponentsMap,
  component?: (props: any) => JSX.Element,
  label: string,
  id?: string,
  props?: {
    connection?: ConnectionConfig
  }
}

type TabStore = {
  tabs: Tab[],
  activeTab: number,
}

const ComponentsMap = {
  Home: Home,
  Console: Console
}

const _tabsStore = createStore<TabStore>({
  tabs: [{ label: '🏠', key: 'Home', component: ComponentsMap['Home'] }],
  activeTab: 1
});

const TAB_STORE_STORAGE_KEY = '_tabs'

export const TabsService = () => {
  const [tabsStore, setTabsStore] = _tabsStore

  onMount(async () => {
    const tabStr = await store.get(TAB_STORE_STORAGE_KEY);
    console.log("Loaded tabStr", tabStr)
    if (!tabStr) return
    const res = JSON.parse(tabStr as string)
    res.tabs = res.tabs.map((t: Tab) => {
      t.component = ComponentsMap[t.key]
      return t
    })
    setTabsStore(() => res as unknown as TabStore)
  })

  const updateStore = async (newStore: TabStore) => {
    await store.set(TAB_STORE_STORAGE_KEY, JSON.stringify(newStore));
    await store.save();
  }

  const addTab = async (tab: Tab) => {
    if (tabsStore.tabs.find(t => t.id === tab.id)) return;
    tab.component = Console;
    const idx = tabsStore.tabs.length + 1
    setTabsStore('tabs', tabsStore.tabs.concat(tab))
    setTabsStore('activeTab', idx)
    await updateStore(tabsStore)
  }

  const removeTab = async (id: string) => {
    const idx = tabsStore.tabs.findIndex(t => t.id === id)
    if (idx <= 0) return;
    setTabsStore('tabs', tabsStore.tabs.filter((_t, i) => i !== idx));
    await updateStore(tabsStore)
  }

  const setActiveTab = (idx: number) => {
    setTabsStore('activeTab', idx)
    updateStore(tabsStore)
  }


  return { tabsStore, addTab, removeTab, setActiveTab }
}

