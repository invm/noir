import { createSignal, For, Match, Switch } from "solid-js";
import { TableStrucureEntity, TableStrucureEntities } from "interfaces";
import { t } from "utils/i18n";
import { StructureTable } from "./Tabs/StructureTable";
import { useAppSelector } from "services/Context";
import { TableStructureContentTabData } from "services/ConnectionTabs";

export const TableStructureTab = () => {
  const {
    connectionsService: { getContentData },
  } = useAppSelector();
  const [tab, setTab] = createSignal<
    keyof Omit<TableStructureContentTabData, "table">
  >(TableStrucureEntity.Columns);
  // const [data, setData] = createStore<
  //   Omit<TableStructureContentTabData, "table">
  // >({
  //   columns: [],
  //   indices: [],
  //   triggers: [],
  //   constraints: [],
  // });

  return (
    <div class="bg-base-200 rounded-tl-md p-2 h-full">
      <div>
        <div class="flex justify-center">
          <div class="tabs tabs-boxed gap-3">
            {TableStrucureEntities.map((ta) => (
              <button
                onClick={() => setTab(ta)}
                tabIndex={0}
                classList={{ "tab-active": tab() === ta }}
                class="tab"
              >
                {t(`components.table_structure_tab.${ta}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Switch fallback={<div>Not found</div>}>
            <For each={TableStrucureEntities}>
              {(item) => (
                <Match when={item === tab()}>
                  <StructureTable
                    data={getContentData("TableStructure")[item]}
                  />
                </Match>
              )}
            </For>
          </Switch>
        </div>
      </div>
    </div>
  );
};
