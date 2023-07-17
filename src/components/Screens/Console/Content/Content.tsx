import { For, Match, Show, Switch } from "solid-js"
import { useAppSelector } from "services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";
import { QueryTab } from "./QueryTab/QueryTab";
import { TableStructureTab } from "./TableStructureTab";
import { ContentComponent } from "services/ConnectionTabs";

export const NEW_QUERY_TAB = { label: 'Query', data: { query: '' }, key: ContentComponent.QueryTab }

export const Content = () => {
  const { connectionsService: {
    updateActiveConnectionActiveContentTabIdx,
    updateActiveConnectionContentTabs,
    updateActiveContentTabData,
    tabsStore: { activeConnectionTab: { contentTabs, activeTabIdx } } }
  } = useAppSelector()

  const addTab = async () => {
    updateActiveConnectionContentTabs([...contentTabs, NEW_QUERY_TAB])
    updateActiveConnectionActiveContentTabIdx(contentTabs.length - 1)
  }

  const updateQueryText = async (query: string) => {
    updateActiveContentTabData({ query })
  }

  const closeTab = async (idx: number) => {
    if (!idx) return;
    updateActiveConnectionContentTabs(contentTabs.filter((_t, i) => i !== idx));
    updateActiveConnectionActiveContentTabIdx(0)
  }

  return (
    <div class="flex flex-col h-full">
      <div class="bg-base-300 tabs gap-1">
        <For each={contentTabs}>
          {(_tab, idx) =>
            <div onClick={() => updateActiveConnectionActiveContentTabIdx(idx())} class="tab py-2 tab-md tab-lifted"
              classList={{ 'tab-active': activeTabIdx === idx() }}
            >{t('components.console.query')} #{idx() + 1}
              <Show when={idx() > 0}>
                <button onClick={() => closeTab(idx())} class="pl-2 mb-1">
                  <CloseIcon />
                </button>
              </Show>
            </div>
          }
        </For>
        <div onClick={() => addTab()} class="tab py-2 tab-sm tab-lifted tab-active" ><AddIcon /></div>
      </div>
      <div class="flex-1">
        <Switch>
          <Match when={contentTabs[activeTabIdx]?.key === ContentComponent.QueryTab}>
            <QueryTab query={contentTabs[activeTabIdx]?.data.query ?? ''} updateQueryText={updateQueryText} />
          </Match>
          <Match when={contentTabs[activeTabIdx]?.key === ContentComponent.TableStructureTab}>
            <TableStructureTab />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
