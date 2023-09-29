import { For, Match, Show, Switch } from "solid-js";
import { useAppSelector } from "services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";
import { QueryTab } from "./QueryTab/QueryTab";
import { TableStructureTab } from "./TableStructure/TableStructureTab";
import { ContentTab } from "services/ConnectionTabs";

export const Content = () => {
  const {
    connectionsService: {
      contentStore,
      setContentIdx,
      addContentTab,
      removeContentTab,
      getContent,
    },
  } = useAppSelector();

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
                class="text-xs p-1 px-2"
                tabindex={0}
                onClick={() => setContentIdx(idx())}
              >
                {t("components.console.query")} #{idx() + 1}
              </button>
              <Show when={idx() > 0}>
                <button
                  onClick={() => removeContentTab(idx())}
                  class="ml-2 mb-1"
                >
                  <CloseIcon />
                </button>
              </Show>
            </div>
          )}
        </For>
        <div class="tab py-2 tab-sm tab-lifted tab-active">
          <button onClick={() => addContentTab()}>
            <AddIcon />
          </button>
        </div>
      </div>
      <div class="flex-1">
        <Switch>
          <Match when={getContent()?.key === ContentTab.Query}>
            <QueryTab />
          </Match>
          <Match when={getContent().key === ContentTab.TableStructure}>
            <TableStructureTab />
          </Match>
        </Switch>
      </div>
    </div>
  );
};
