import { TableColumnsCollapse } from './TableColumnsCollapse';
import { useAppSelector } from 'services/Context';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { createSignal, For, Match, Switch } from 'solid-js';
import { t } from 'utils/i18n';
import { Refresh, Terminal } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';
import { ResultSet } from 'interfaces';
import { get } from 'utils/utils';
import { newContentTab } from 'services/Connections';

export const Sidebar = () => {
  const {
    messages: { notify },
    connections: {
      insertColumnName,
      getConnection,
      updateConnectionTab,
      addContentTab,
      getSchemaEntity,
      fetchSchemaEntities,
      updateSchemaDefinition,
    },
  } = useAppSelector();
  const [loading, setLoading] = createSignal(false);

  const menu_id = 'sidebar-routine-menu';

  const { show } = useContextMenu({
    id: menu_id,
    props: {},
  });

  const select = async (schema: string) => {
    updateConnectionTab('selectedSchema', schema);
    const config = getConnection();
    await invoke('set_schema', { connId: config.id, schema, dialect: config.connection.dialect });
    const { triggers, routines, tables, schemas, columns, views } = await fetchSchemaEntities(
      config.id,
      config.connection.dialect
    );
    updateConnectionTab('schemas', schemas);
    updateSchemaDefinition(config.id, { triggers, routines, columns, tables, views });
  };

  const refreshEntities = async () => {
    const config = getConnection().connection;
    try {
      setLoading(true);
      await invoke('init_connection', { config });
      const { triggers, routines, tables, schemas, columns, views } = await fetchSchemaEntities(
        config.id,
        config.dialect
      );
      updateConnectionTab('schemas', schemas);
      updateSchemaDefinition(config.id, { triggers, routines, columns, tables, views });
    } catch (error) {
      notify(error);
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
      const data = { query, result_sets: [res], cursor: 0, auto_limit: false };
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
      const schema = getConnection().selectedSchema;
      const query = `SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = "${schema}" and TRIGGER_NAME = "${trigger}"`;
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
          value={getConnection().selectedSchema}
          onChange={(e) => select(e.currentTarget.value)}
          class="select select-accent select-bordered select-xs w-full">
          <For each={getConnection().schemas}>
            {(db) => (
              <option class="py-1" value={db}>
                {db}
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
        <For each={getSchemaEntity('tables')}>
          {(table) => (
            <div class="mb-1 px-2 min-w-full w-fit">
              <TableColumnsCollapse title={table.name} entity="tables">
                <For each={table.columns}>
                  {(column) => (
                    <button
                      onClick={() => insertColumnName(column.name)}
                      class="flex btn-ghost w-full justify-between items-center w-full border-b-2 border-base-300">
                      <span class="text-xs font-semibold">{column.name}</span>
                      <span class="text-xs font-medium ml-2">
                        {column.props.COLUMN_TYPE ?? column.props.column_type}
                      </span>
                    </button>
                  )}
                </For>
              </TableColumnsCollapse>
            </div>
          )}
        </For>
        <div class="text-xs font-bold py-1">{t('sidebar.views')}</div>
        <For each={getSchemaEntity('views')}>
          {(table) => (
            <div class="mb-1 px-2 min-w-full w-fit">
              <TableColumnsCollapse title={table.name} entity="routines">
                <For each={table.columns}>
                  {(column) => (
                    <button
                      onClick={() => insertColumnName(column.name)}
                      class="flex btn-ghost w-full justify-between items-center w-full border-b-2 border-base-300">
                      <span class="text-xs font-semibold">{column.name}</span>
                      <span class="text-xs font-medium ml-2">
                        {column.props.COLUMN_TYPE ?? column.props.column_type}
                      </span>
                    </button>
                  )}
                </For>
              </TableColumnsCollapse>
            </div>
          )}
        </For>
        <div class="text-xs font-bold py-1">{t('sidebar.routines')}</div>
        <For each={getSchemaEntity('routines')}>
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
        <For each={getSchemaEntity('triggers')}>
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
