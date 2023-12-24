import { TableColumnsCollapse } from './TableColumnsCollapse';
import { useAppSelector } from 'services/Context';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { createEffect, createSignal, For, Match, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { t } from 'utils/i18n';
import { Refresh, Terminal } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';
import { RawQueryResult, ResultSet, Row, Table } from 'interfaces';
import { columnsToSchema, get } from 'utils/utils';
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
      getSchemaRoutines,
      getSchemaTriggers,
    },
  } = useAppSelector();
  const [tables, setTables] = createStore<Table[]>([]);
  const [routines, setRoutines] = createStore<Row[]>([]);
  const [triggers, setTriggers] = createStore<Row[]>([]);
  const [loading, setLoading] = createSignal(false);

  const menu_id = 'sidebar-routine-menu';

  const { show } = useContextMenu({
    id: menu_id,
    props: {},
  });

  createEffect(() => {
    if (connectionStore.schema) {
      setTables(getSchemaTables(connectionStore.schema));
      setRoutines(getSchemaRoutines());
      setTriggers(getSchemaTriggers());
    }
  });

  const select = (schema: string) => {
    setConnectionStore('schema', schema);
    setTables(getSchemaTables(schema));
    setRoutines(getSchemaRoutines());
    setTriggers(getSchemaTriggers());
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

      const { result: routines } = await invoke<RawQueryResult>('get_procedures', {
        connId: getConnection().id,
      });

      updateConnectionTab('routines', routines);
      setRoutines(routines);
      const { result: triggers } = await invoke<RawQueryResult>('get_triggers', {
        connId: config.id,
      });
      console.log({ triggers });
      setTriggers(triggers);
      updateConnectionTab('triggers', triggers);
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
      addContentTab(newContentTab(t('sidebar.process_list'), 'Query', data));
    } catch (error) {
      notify(error);
    }
  };

  const showRoutine = async (routine: string) => {
    try {
      const query = 'SHOW CREATE PROCEDURE ' + routine;
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
        autoLimit: false,
      });
      const data = { query, result_sets: [res], cursor: 0 };
      addContentTab(newContentTab(routine, 'Query', data));
    } catch (error) {
      notify(error);
    }
  };

  const showCreateStatement = (name: string, stmt: string) => {
    const data = { query: stmt, result_sets: [], cursor: 0 };
    addContentTab(newContentTab(name, 'Query', data));
  };

  const showTrigger = async (trigger: string) => {
    try {
      const query =
        `SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = "${connectionStore.schema}" and TRIGGER_NAME = "${trigger}"`;
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
        autoLimit: false,
      });
      const data = { query, result_sets: [res], cursor: 0 };
      addContentTab(newContentTab(trigger, 'Query', data));
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
      <div class="overflow-y-auto h-full pb-10">
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
        <div class="text-xs font-bold py-1">{t('sidebar.routines')}</div>
        <For each={routines}>
          {(routine) => (
            <div class="px-2 min-w-full w-fit">
              <div class="" onContextMenu={(e) => show(e)}>
                <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
                  <Item onClick={() => showRoutine(routine.ROUTINE_NAME as string)}>{t('sidebar.show_routine')}</Item>
                  <Item
                    onClick={() =>
                      showCreateStatement(routine.ROUTINE_NAME as string, routine.ROUTINE_DEFINITION as string)
                    }>
                    {t('sidebar.show_create_statement')}
                  </Item>
                </Menu>
                {<span class="text-xs font-semibold">{get(routine, 'ROUTINE_NAME')}</span>}
              </div>
            </div>
          )}
        </For>
        <div class="text-xs font-bold py-1">{t('sidebar.triggers')}</div>
        <For each={triggers}>
          {(trigger) => (
            <div class="px-2 min-w-full w-fit">
              <div class="" onContextMenu={(e) => show(e)}>
                <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
                  <Item onClick={() => showTrigger(trigger.TRIGGER_NAME as string)}>{t('sidebar.show_trigger')}</Item>
                  <Item
                    onClick={() =>
                      showCreateStatement(trigger.TRIGGER_NAME as string, trigger.ACTION_STATEMENT as string)
                    }>
                    {t('sidebar.show_create_statement')}
                  </Item>
                </Menu>
                {<span class="text-xs font-semibold">{get(trigger, 'TRIGGER_NAME')}</span>}
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
