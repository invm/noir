import './utils/i18n';
import Home from './pages/Home';
import { Route, Router, Routes } from "@solidjs/router"; // 👈 Import the router
import Connection from './pages/Connection';
import { StoreProvider } from './services/Context';
import { Alerts } from './components/Alerts';
import { createSignal, For } from 'solid-js';
import { createStore } from 'solid-js/store';

function App() {
  const [activeTab, setActiveTab] = createSignal(0);
  const [tabs, setTabs] = createStore([
    { name: 'Home', component: Home },
    { name: 'Connection', component: Connection },
  ]);

  return (
    <StoreProvider>
      <div class="w-full h-full">
        <div class="p-2 tabs tabs-boxed rounded-none gap-2">
          <For each={tabs}>
            {(tab, i) =>
              <a onClick={() => setActiveTab(i)} class="tab" classList={{
                'tab-active': activeTab() === i(),
              }}>{tab.name}</a>
            }
          </For>
        </div>
        <div class="bg-red-500">
          <For each={tabs}>
            {(tab, i) =>
              <div classList={{
                'hidden': activeTab() !== i(),
              }}>
                <h2 class="text">
                  {tab.name}
                </h2>
              </div>
            }
          </For>
        </div>
      </div>
      <Alerts />
    </StoreProvider >
  );
}

export default App;
