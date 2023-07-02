import { JSX } from "solid-js/jsx-runtime";
import { createStore } from "solid-js/store"
import Home from "../components/main/Home";
import Connection from "../components/main/Connection";
import { ConnectionConfig } from "../interfaces";
import { register, unregister } from '@tauri-apps/api/globalShortcut';

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
  registeredShortcuts?: string[]
}>({
  registeredShortcuts: ['CommandOrControl+1'],
  tabs: [{ label: '🏠', component: Home, removable: false }],
  activeTab: 1
});

export const TabsService = () => {
  const [tabsStore, setTabsStore] = _tabsStore

  const addTab = async (tab: Tab) => {
    if (tabsStore.tabs.find(t => t.id === tab.id)) return;
    tab.component = Connection;
    tab.removable = true;
    const idx = tabsStore.tabs.length + 1
    setTabsStore('tabs', tabsStore.tabs.concat(tab))
    setTabsStore('activeTab', idx)
    setTabsStore('registeredShortcuts', tabsStore.registeredShortcuts!.concat(`CommandOrControl+${idx}`))
    await register(`CommandOrControl+${idx}`, () => { setActiveTab(idx) });
  }

  const removeTab = async (id: string) => {
    const idx = tabsStore.tabs.findIndex(t => t.id === id)
    if (idx <= 0) return;
    setTabsStore('tabs', tabsStore.tabs.filter((_t, i) => i !== idx));
    await Promise.all(tabsStore.registeredShortcuts!.map(async (shortcut) => {
      await unregister(shortcut);
    }))
    setTabsStore('registeredShortcuts', [])
    await Promise.all(tabsStore.tabs.map(async (_t, i) => {
      await register(`CommandOrControl+${i + 1}`, () => { setActiveTab(i + 1) });
      setTabsStore('registeredShortcuts', tabsStore.registeredShortcuts!.concat(`CommandOrControl+${i + 1}`))
    }));
  }

  const setActiveTab = (idx: number) => {
    setTabsStore('activeTab', idx)
  }


  return { tabsStore, addTab, removeTab, setActiveTab }
}

