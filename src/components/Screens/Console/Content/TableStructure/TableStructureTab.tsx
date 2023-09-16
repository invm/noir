import { useAppSelector } from "services/Context";
import {
  createEffect,
  createSignal,
  For,
  Match,
  on,
  onMount,
  Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api";
import { TableStructureResult, TableStrucureEntities } from "interfaces";
import { t } from "utils/i18n";
import { Loader } from "components/UI";
import { createStore } from "solid-js/store";
import { StructureTable } from "./Tabs/StructureTable";
import { TableStructureContentTabData } from "services/ConnectionTabs";

export const TableStructureTab = () => {
  const {
    connectionsService: { getActiveConnection, getActiveContentTab },
    errorService: { addError },
  } = useAppSelector();
  const [loading, setLoading] = createSignal(true);
  const [tabIdx, setTabIdx] = createSignal(0);
  const [data, setData] = createStore<TableStructureResult>(
    {} as TableStructureResult
  );
  const activeConnection = getActiveConnection();
  const activeTab = getActiveContentTab();

  createEffect(
    on(getActiveContentTab(), async () => {
      try {
        const { columns, indices, triggers, constraints } =
          await invoke<TableStructureResult>("get_table_structure", {
            connId: activeConnection.id,
            tableName: (activeTab.data as TableStructureContentTabData).table,
          });
        setData({ columns, indices, triggers, constraints });
      } catch (error) {
        addError(error);
      }
      setLoading(false);
    })
  );

  return (
    <div class="bg-base-200 rounded-tl-md p-2 h-full">
      {loading() ? (
        <div class="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : (
        <div>
          <div class="flex justify-center">
            <div class="tabs tabs-boxed gap-1">
              {TableStrucureEntities.map((tab, idx) => (
                <button
                  onClick={() => setTabIdx(idx)}
                  tabIndex={0}
                  classList={{ "tab-active": tabIdx() === idx }}
                  class="tab"
                >
                  {t(`components.table_structure_tab.${tab}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Switch fallback={<div>Not found</div>}>
              <For each={TableStrucureEntities}>
                {(item, idx) => (
                  <Match when={tabIdx() === idx()}>
                    <StructureTable data={data[item]} />
                  </Match>
                )}
              </For>
            </Switch>
          </div>
        </div>
      )}
    </div>
  );
};
