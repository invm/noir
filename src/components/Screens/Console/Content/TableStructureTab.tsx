import { useAppSelector } from "services/Context";
import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api";
import { TableStructureResult } from "interfaces";
import { t } from "utils/i18n";
import { Loader } from "components/UI";
import { createStore } from "solid-js/store";
import { Table } from "./TableStructure/Tabs/Table";

export const TableStructureTab = () => {
  const {
    connectionsService: {
      getActiveConnection,
      getActiveContentTab
    },
    errorService: { addError },
  } = useAppSelector();
  const [loading, setLoading] = createSignal(true);
  const [tabIdx, setTabIdx] = createSignal(0);
  const tabs = ["columns", "indices", "constraints", "triggers"];
  const [data, setData] = createStore<Record<string, Record<string, any>[]>>(
    {}
  );

  onMount(async () => {
    const activeConnection = getActiveConnection();
    const activeTab = getActiveContentTab()
    console.log(activeTab)
    try {
      const { columns, indices, triggers, constraints } =
        await invoke<TableStructureResult>("get_table_structure", {
          connId: activeConnection.id,
          tableName: "app",
        });
      setData({ columns, indices, triggers, constraints });
    } catch (error) {
      addError(error);
    }
    setLoading(false);
  });

  return (
    <div class="bg-base-100 rounded-tl-md p-2 h-full">
      {loading() ? (
        <div class="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : (
        <div>
          <div class="flex justify-center">
            <div class="tabs tabs-boxed gap-1">
              {tabs.map((tab, idx) => (
                <button
                  onClick={() => setTabIdx(idx)}
                  tabIndex={0}
                  classList={{ "tab-active": tabIdx() === idx }}
                  class="tab text-black"
                >
                  {t(`components.table_structure_tab.${tab}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Switch fallback={<div>Not found</div>}>
              <For each={tabs}>
                {(item, idx) => (
                  <Match when={tabIdx() === idx()}>
                    <Table data={data[item]} />
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
