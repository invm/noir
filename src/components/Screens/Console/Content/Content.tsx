import { For, Match, Show, Switch } from "solid-js"
import { useAppSelector } from "services/Context";
import { AddIcon, CloseIcon } from "components/UI/Icons";
import { t } from "utils/i18n";
import { QueryTab } from "./QueryTab/QueryTab";
import { TableStructureTab } from "./TableStructureTab";
import { ContentComponent, ContentTab, ContentTabData, NEW_QUERY_TAB } from "services/ConnectionTabs";

export const Content = () => {
  const { connectionsService: { contentStore, setContentStore } } = useAppSelector()

  const addTab = async () => {
    setContentStore('tabs', [...contentStore.tabs, NEW_QUERY_TAB])
    setContentStore('idx', contentStore.tabs.length - 1)
  }

  const updateQueryText = async (query: string) => {
    setContentStore('tabs', contentStore.tabs.map((t, idx) => idx === contentStore.idx ? {
      ...t,
      data: { ...t.data, query }
    } as ContentTab<'QueryTab'> : t))
  }

  const closeTab = async (idx: number) => {
    if (!idx) return;
    setContentStore('tabs', contentStore.tabs.filter((_t, i) => i !== idx));
    setContentStore('idx', 0)
  }

  return (
    <div class="flex flex-col h-full">
      <div class="bg-base-300 tabs gap-1">
        <For each={contentStore.tabs}>
          {(_tab, idx) =>
            <div onClick={() => setContentStore('idx', idx())} class="tab py-2 tab-md tab-lifted"
              classList={{ 'tab-active': contentStore.idx === idx() }}
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
          <Match when={contentStore.tabs[contentStore.idx]?.key === ContentComponent.QueryTab}>
            <QueryTab query={(contentStore.tabs[contentStore.idx]?.data as ContentTabData['QueryTab']).query} updateQueryText={updateQueryText} />
          </Match>
          <Match when={contentStore.tabs[contentStore.idx]?.key === ContentComponent.TableStructureTab}>
            <TableStructureTab />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
