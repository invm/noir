import { createSignal, For, Match, Switch } from "solid-js";
import {
  TableEntity,
  TableStrucureEntities,
  TableStrucureEntityType,
} from "interfaces";
import { t } from "utils/i18n";
import { StructureTable } from "./Tabs/StructureTable";
import { useAppSelector } from "services/Context";

export const TableStructureTab = () => {
  const {
    connections: { getContentData, getConnection },
  } = useAppSelector();
  const [tab, setTab] = createSignal<TableStrucureEntityType>(
    TableEntity.columns
  );

  return (
    <div class="bg-base-100 rounded-tl-md p-2 h-full pb-[100px] overflow-y-scroll">
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
                {t(`table_structure_tab.${ta}`)}
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
                    type={item}
                    dialect={getConnection().connection.dialect}
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
