import { For, Match, Show, Switch } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { AddIcon, CloseIcon } from 'components/UI/Icons';
import { QueryTab } from './QueryTab/QueryTab';
import { TableStructureTab } from './TableStructure/TableStructureTab';
import { ContentTab } from 'services/Connections';
import { DataTab } from './DataTab/DataTab';

export const Content = () => {
  const {
    connections: { setContentIdx, getConnection, addContentTab, removeContentTab, getContent },
  } = useAppSelector();

  const key = () => getContent().key;

  return (
    <div class="flex flex-col h-full">
      <div role="tablist" class="bg-base-300 tabs tabs-md tabs-lifted gap-1 flex">
        <For each={getConnection().tabs}>
          {(_tab, idx) => (
            <a role="tab" class="max-w-fit tab !pr-1 !pl-1" classList={{ 'tab-active': getConnection().idx === idx() }}>
              <button class="text-xs p-1 px-3" onClick={() => setContentIdx(idx())}>
                {_tab.label}
              </button>
              <Show when={idx() > 0}>
                <button onClick={() => removeContentTab(idx())} class="ml-2 mb-1 p-1">
                  <CloseIcon />
                </button>
              </Show>
            </a>
          )}
        </For>
        <div class="tab tab-active max-w-fit">
          <button onClick={() => addContentTab()}>
            <AddIcon />
          </button>
        </div>
      </div>
      <div class="h-full w-full">
        <Switch>
          <Match when={key() === ContentTab.Query}>
            <QueryTab />
          </Match>
          <Match when={key() === ContentTab.TableStructure}>
            <TableStructureTab tabIdx={getConnection().idx} />
          </Match>
          <Match when={key() === ContentTab.Data}>
            <DataTab />
          </Match>
        </Switch>
      </div>
    </div>
  );
};
