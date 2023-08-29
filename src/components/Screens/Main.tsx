import { Alerts } from "components/UI";
import { CloseIcon } from "components/UI/Icons";
import { ThemeSwitch } from "components/UI/ThemeSwitch";
import { useAppSelector } from "services/Context";
import { For, Match, Show, Switch } from "solid-js";
import { Console } from "./Console/Console";
import { Home } from "./Home/Home";

export const Main = () => {
  const {
    connectionsService: {
      removeConnectionTab,
      // clearStore,
      connectionStore,
      setConnectionStore,
    },
  } = useAppSelector();

  const closeTab = async (id: string) => {
    await removeConnectionTab(id);
  };

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pb-2 bg-base-300 rounded-none gap-2 flex justify-between items-center">
        <div class="tabs tabs-boxed">
          <button
            onClick={() => {
              setConnectionStore("idx", 0);
            }}
            class="tab tab-md"
            tabIndex={0}
            classList={{ "tab-active": connectionStore.idx === 0 }}
          >
            <span class="text-md font-bold">Home</span>
          </button>
          <For each={connectionStore.tabs}>
            {(tab, idx) => (
              <div class="tab tab-md flex items-center">
                <button
                  onClick={() => setConnectionStore("idx", idx() + 1)}
                  class="tab tab-md"
                  classList={{
                    "tab-active": connectionStore.idx === idx() + 1,
                  }}
                  tabindex={0}
                >
                  <span class="text-md font-bold">{tab.label}</span>
                </button>
                <Show when={connectionStore.idx === idx() + 1}>
                  <button
                    tabindex={0}
                    onClick={() => closeTab(tab.id!)}
                    class="ml-2 mb-1"
                  >
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
        <div>
          {/* <button onClick={async () => await clearStore()}>Reset store</button> */}
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
    </div>
  );
};
