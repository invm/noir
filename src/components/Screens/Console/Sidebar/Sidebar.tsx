import { TableColumnsCollapse } from './TableColumnsCollapse';
import { useAppSelector } from 'services/Context';
import { createEffect, createSignal, For, Match, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { t } from 'utils/i18n';
import { Refresh, Terminal } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';
import { RawQueryResult, ResultSet, Table } from 'interfaces';
import { columnsToSchema } from 'utils/utils';
import { newContentTab } from 'services/Connections';

export const Sidebar = () => {
  const {
    messages: { notify },
    connections: {
      insertColumnName,
      getConnection,
      updateConnectionTab,
      connectionStore,
      setConnectionStore,
      getSchemaTables,
      addContentTab,
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
    setConnectionStore('schema', schema);
    setTables(getSchemaTables(schema));
  };

  const refreshEntities = async () => {
    const config = getConnection().connection;
    try {
      setLoading(true);
      await invoke('init_connection', { config });
      const { result } = await invoke<RawQueryResult>('get_columns', {
        connId: config.id,
      });
      const schema = columnsToSchema(result, config.dialect);
      updateConnectionTab('schema', schema);

      const procedures = await invoke<RawQueryResult>('get_procedures', {
        connId: getConnection().id,
      });
      // TODO: add procedures to siderbar
      console.log({ procedures });
    } catch (error) {
      notify(String(error), 'info');
    } finally {
      setLoading(false);
    }
  };

  const showProcessList = async () => {
    try {
      const query = 'SHOW PROCESSLIST';
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
        autoLimit: false,
      });
      const data = { query, result_sets: [res], cursor: 0 };
      addContentTab(newContentTab('Process list', 'Query', data));
    } catch (error) {
      notify(error);
    }
  };

  return (
    <div class="p-2 bg-base-300 h-full rounded-tr-lg">
      <div class="pb-2 rounded-md flex justify-center items-center">
        <select
          id="schema"
          value={connectionStore.schema}
          onChange={(e) => select(e.currentTarget.value)}
          class="select select-accent select-bordered select-xs w-full">
          <For each={(getConnection() && Object.keys(getConnection()?.schema)) ?? []}>
            {(_schema) => (
              <option class="py-1" value={_schema}>
                {_schema}
              </option>
            )}
          </For>
        </select>
        <div class="tooltip tooltip-primary tooltip-bottom" data-tip={t('sidebar.show_process_list')}>
          <button onClick={showProcessList} disabled={loading()} class="ml-2 btn btn-xs">
            <Switch>
              <Match when={loading()}>
                <span class="loading text-primary loading-bars loading-xs"></span>
              </Match>
              <Match when={!loading()}>
                <Terminal />
              </Match>
            </Switch>
          </button>
        </div>
        <div class="tooltip tooltip-primary tooltip-bottom" data-tip={t('sidebar.refresh_schema')}>
          <button onClick={refreshEntities} disabled={loading()} class="ml-2 btn btn-xs">
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
      </div>
      <div class="overflow-y-auto h-full">
        <div class="text-xs font-bold py-1">{t('sidebar.tables')}</div>
        <For each={tables}>
          {(table) => (
            <div class="mb-1 px-2 min-w-full w-fit">
              <TableColumnsCollapse title={table.name}>
                <For each={table.columns}>
                  {(column) => (
                    <button
                      onClick={() => insertColumnName(column.name)}
                      class="flex btn-ghost w-full justify-between items-center w-full border-b-2 border-base-300">
                      <span class="text-xs font-semibold">{column.name}</span>
                      <span class="text-xs font-medium ml-2">{column.props.COLUMN_TYPE}</span>
                    </button>
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
