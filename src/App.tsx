import 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { Alerts } from 'components/UI';
import { For, Match, Show, Switch } from 'solid-js';
import { CloseIcon } from 'components/UI/Icons';
import { ThemeSwitch } from 'components/UI/ThemeSwitch';
import { Console } from 'components/Screens/Console/Console';
import { Home } from 'components/Screens/Home/Home';

function App() {
  const { connectionsService: { removeTab, clearStore, connectionStore, setConnectionStore } } = useAppSelector()

  const closeTab = async (id: string) => {
    await removeTab(id)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pb-2 bg-base-300 tabs tabs-boxed rounded-none gap-2 flex justify-between items-center">
        <div class="flex items-center">
          <div class="flex items-center">
            <div onClick={() => {
              console.log('click')
              setConnectionStore('idx', 0)
            }} class="tab tab-md"
              classList={{ 'tab-active': connectionStore.idx === 0, }} >
              <span class="text-md font-bold">Home</span>
            </div>
          </div>
          <For each={connectionStore.tabs}>
            {(tab, idx) =>
              <div class="flex items-center">
                <div onClick={() => { setConnectionStore('idx', idx() + 1) }}
                  class="tab tab-md"
                  classList={{ 'tab-active': connectionStore.idx === idx() + 1, }}
                ><span class="text-md font-bold">{tab.label}</span></div>
                <Show when={connectionStore.idx === idx() + 1}>
                  <button onClick={() => closeTab(tab.id!)} class="pl-2 mb-1">
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            }
          </For>
        </div>
        <div>
          <button onClick={async () => await clearStore()}>Reset store</button>
          <ThemeSwitch />
        </div>
      </div>
      <div class="flex-1 overflow-hidden">
        <Switch>
          <Match when={connectionStore.idx === 0}>
            <Home />
          </Match>
          <Match when={connectionStore.idx !== 0}>
            <Console />
          </Match>
        </Switch>
      </div>
      <Alerts />
    </div >
  );
}

export default App;
