import { For, Match, Show, Switch } from "solid-js";
import { useAppSelector } from "services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";
import { QueryTab } from "./QueryTab/QueryTab";
import { TableStructureTab } from "./TableStructureTab";
import { ContentComponent, newContentTab} from "services/ConnectionTabs";

export const Content = () => {
  const {
    connectionsService: { contentStore, setContentStore, updateStore },
  } = useAppSelector();

  const addTab = async () => {
    setContentStore("tabs", [...contentStore.tabs, newContentTab('Query', 'QueryTab')]);
    setContentStore("idx", contentStore.tabs.length - 1);
    updateStore();
  };

  const closeTab = async (idx: number) => {
    if (!idx) return;
    setContentStore(
      "tabs",
      contentStore.tabs.filter((_t, i) => i !== idx)
    );
    setContentStore("idx", 0);
    updateStore();
  };

  return (
    <div class="flex flex-col h-full">
      <div class="bg-base-300 tabs gap-1">
        <For each={contentStore.tabs}>
          {(_tab, idx) => (
            <div
              class="tab py-2 tab-md tab-lifted"
              classList={{ "tab-active": contentStore.idx === idx() }}
            >
              <button
                class="text-xs"
                tabindex={0}
                onClick={() => setContentStore("idx", idx())}
              >
                {t("components.console.query")} #{idx() + 1}
              </button>
              <Show when={idx() > 0}>
                <button onClick={() => closeTab(idx())} class="ml-2 mb-1">
                  <CloseIcon />
                </button>
              </Show>
            </div>
          )}
        </For>
        <div class="tab py-2 tab-sm tab-lifted tab-active">
          <button onClick={() => addTab()}>
            <AddIcon />
          </button>
        </div>
      </div>
      <div class="flex-1">
        <Switch>
          <Match
            when={
              contentStore.tabs[contentStore.idx]?.key ===
              ContentComponent.QueryTab
            }
          >
            <QueryTab />
          </Match>
          <Match
            when={
              contentStore.tabs[contentStore.idx]?.key ===
              ContentComponent.TableStructureTab
            }
          >
            <TableStructureTab />
          </Match>
        </Switch>
      </div>
    </div>
  );
};
