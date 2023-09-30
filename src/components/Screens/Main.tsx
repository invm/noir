import { Alerts } from "components/UI";
import { CloseIcon, HomeIcon, QuestionMark } from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Console } from "./Console/Console";
import { Home } from "./Home/Home";
import { Settings } from "./Settings/Settings";

export const Main = () => {
  const {
    connectionsService: {
      removeConnectionTab,
      connectionStore,
      setConnectionStore,
    },
  } = useAppSelector();

  const [showSettings, setShowSettings] = createSignal(false);

  return (
    <div class="w-full h-full flex flex-col">
      <div class="px-2 pt-2 bg-base-300 rounded-none gap-2 flex justify-between items-center">
        <div class="tabs tabs-boxed gap-2">
          <button
            onClick={() => {
              setShowSettings(false);
              setConnectionStore("idx", 0);
            }}
            class="tab tab-md"
            tabIndex={0}
            classList={{ "tab-active": connectionStore.idx === 0 }}
          >
            <span class="text-md font-bold">
              <HomeIcon />
            </span>
          </button>
          <For each={connectionStore.tabs}>
            {(tab, idx) => (
              <div class="flex items-center">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setConnectionStore("idx", idx() + 1);
                  }}
                  class="tab tab-md pt-1"
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
                    onClick={() => removeConnectionTab(tab.id!)}
                    class="ml-2"
                  >
                    <CloseIcon />
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
        <div>
          <button
            class="btn btn-square btn-ghost btn-sm"
            onClick={() => setShowSettings((s) => !s)}
          >
            <QuestionMark />
          </button>
        </div>
      </div>
      <div class="flex-1 overflow-hidden flex">
        <Switch>
          <Match when={showSettings()}>
            <Settings />
          </Match>
          <Match when={!showSettings()}>
            <Switch>
              <Match when={connectionStore.idx === 0}>
                <Home />
              </Match>
              <Match when={connectionStore.idx !== 0}>
                <Console />
              </Match>
            </Switch>
          </Match>
        </Switch>
      </div>
      <Alerts />
    </div>
  );
};
