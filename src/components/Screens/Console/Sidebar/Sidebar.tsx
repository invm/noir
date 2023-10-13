import { TableColumnsCollapse } from "./TableColumnsCollapse";
import { useAppSelector } from "services/Context";
import { createEffect, createSignal, For, Match, onMount, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { t } from "utils/i18n";
import { Refresh } from "components/UI/Icons";
import { invoke } from "@tauri-apps/api";
import { RawQueryResult, Table } from "interfaces";
import { columnsToSchema } from "utils/utils";

export const Sidebar = () => {
  const {
    messages: { notify },
    connections: {
      getConnection,
      updateConnectionTab,
      connectionStore,
      setConnectionStore,
      getSchemaTables,
    },
  } = useAppSelector();
  const [tables, setTables] = createStore<Table[]>([]);
  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (connectionStore.schema) {
      setTables(getSchemaTables(connectionStore.schema));
    }
  });

  const select = (schema: string) => {
    setConnectionStore("schema", schema);
    setTables(getSchemaTables(schema));
  };

  const refreshEntities = async () => {
    const config = getConnection().connection;
    try {
      setLoading(true);
      await invoke("init_connection", { config });
      const { result } = await invoke<RawQueryResult>("get_columns", {
        connId: config.id,
      });
      const schema = columnsToSchema(result, config.dialect);
      updateConnectionTab("schema", { schema });

      const procedures = await invoke<RawQueryResult>("get_procedures", {
        connId: getConnection().id,
      });
      // TODO: add procedures to siderbar
      console.log({ procedures });
    } catch (error) {
      notify(String(error), "info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="p-2 bg-base-300 h-full rounded-tr-lg">
      <div class="pb-2 rounded-md flex justify-center items-center">
        <select
          id="schema"
          value={connectionStore.schema}
          onChange={(e) => select(e.currentTarget.value)}
          class="select select-accent select-bordered select-xs w-full"
        >
          <For each={Object.keys(getConnection().schema)}>
            {(_schema) => (
              <option class="py-1" value={_schema}>
                {_schema}
              </option>
            )}
          </For>
        </select>
        <button
          onClick={refreshEntities}
          disabled={loading()}
          class="ml-2 btn btn-xs"
        >
          <Switch>
            <Match when={loading()}>
              <span class="loading text-primary loading-bars loading-xs"></span>
            </Match>
            <Match when={!loading()}>
              <Refresh />
            </Match>
          </Switch>
        </button>
      </div>
      <div class="overflow-y-auto h-full">
        <div class="text-xs font-bold py-1">
          {t('sidebar.tables')}
        </div>
        <For each={tables}>
          {(table) => (
            <div class="mb-1 px-2 min-w-full w-fit">
              <TableColumnsCollapse title={table.name}>
                <For each={table.columns}>
                  {(column) => (
                    <div class="flex w-full justify-between items-center w-full border-b-2 border-base-300">
                      <span class="text-xs font-semibold">
                        {column.name}
                      </span>
                      <span class="text-xs font-medium ml-2">
                        {column.props.COLUMN_TYPE}
                      </span>
                    </div>
                  )}
                </For>
              </TableColumnsCollapse>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
