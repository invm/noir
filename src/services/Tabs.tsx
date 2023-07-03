import { JSX } from "solid-js/jsx-runtime";
import { createStore } from "solid-js/store"
import { Home } from "../components/main/Home";
import { Console } from "../components/main/Console";
import { ConnectionConfig } from "../interfaces";

type Tab = {
  component?: () => JSX.Element
  label: string
  id?: string,
  connection?: ConnectionConfig;
  removable?: boolean
}

const _tabsStore = createStore<{
  tabs: Tab[],
  activeTab: number,
}>({
  tabs: [{ label: '🏠', component: Home, removable: false }],
  activeTab: 1
});

export const TabsService = () => {
  const [tabsStore, setTabsStore] = _tabsStore

  const addTab = async (tab: Tab) => {
    if (tabsStore.tabs.find(t => t.id === tab.id)) return;
    tab.component = Console;
    tab.removable = true;
    const idx = tabsStore.tabs.length + 1
    setTabsStore('tabs', tabsStore.tabs.concat(tab))
    setTabsStore('activeTab', idx)
  }

  const removeTab = async (id: string) => {
    const idx = tabsStore.tabs.findIndex(t => t.id === id)
    if (idx <= 0) return;
    setTabsStore('tabs', tabsStore.tabs.filter((_t, i) => i !== idx));
  }

  const setActiveTab = (idx: number) => {
    setTabsStore('activeTab', idx)
  }


  return { tabsStore, addTab, removeTab, setActiveTab }
}

