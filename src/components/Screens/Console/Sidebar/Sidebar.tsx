import { TableColumnsCollapse } from './TableColumnsCollapse';
import { useAppSelector } from 'services/Context';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { t } from 'utils/i18n';
import { Function, Refresh, ShareNodes, Terminal } from 'components/UI/Icons';
import { invoke } from '@tauri-apps/api';
import { ResultSet } from 'interfaces';
import { newContentTab } from 'services/Connections';
import { getAnyCase } from 'utils/utils';

export const Sidebar = () => {
  const {
    messages: { notify },
    connections: {
      getConnection,
      updateConnectionTab,
      addContentTab,
      getSchemaEntity,
      fetchSchemaEntities,
      updateSchemaDefinition,
    },
  } = useAppSelector();
  const [loading, setLoading] = createSignal(false);

  const routine_menu = 'sidebar-routine-menu';
  const trigger_menu = 'sidebar-trigger-menu';

  const { show: show_routine_menu, hideAll } = useContextMenu({ id: routine_menu, props: { routine: '1' } });

  const { show: show_trigger_menu } = useContextMenu({ id: trigger_menu });

  const selectSchema = async (schema: string) => {
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
      const conn = getConnection();
      let query = 'SHOW PROCESSLIST';
      if (conn.connection.dialect === 'Postgresql') {
        query = 'SELECT * FROM pg_stat_activity';
      }
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
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
      const query = `SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '${schema}' and TRIGGER_NAME = '${trigger}'`;
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
      });
      const data = { query, result_sets: [res], cursor: 0 };
      addContentTab(newContentTab(trigger, 'Query', data));
    } catch (error) {
      notify(error);
    }
  };

  return (
    <div class="p-2 bg-base-300 h-full rounded-tr-lg">
      <div class="pb-2 rounded-md flex justify-between items-center">
        <div class="tooltip tooltip-primary tooltip-right" data-tip={t('sidebar.select_schema')}>
          <select
            id="schema"
            value={getConnection().selectedSchema}
            onChange={(e) => selectSchema(e.currentTarget.value)}
            class="select select-accent select-bordered select-xs w-full">
            <For each={getConnection().schemas}>
              {(db) => (
                <option class="py-1" value={db}>
                  {db}
                </option>
              )}
            </For>
          </select>
        </div>
        <div class="flex">
          <div class="tooltip tooltip-primary tooltip-right" data-tip={t('sidebar.show_process_list')}>
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
          <div class="tooltip tooltip-primary tooltip-right" data-tip={t('sidebar.refresh_schema')}>
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
      </div>
      <div class="overflow-y-auto h-full pb-10 pr-2">
        <div class="text-xs font-bold py-1">{t('sidebar.tables')}</div>
        <For each={getSchemaEntity('tables')}>
          {(table) => (
            <div class="min-w-full w-fit">
              <TableColumnsCollapse title={table.name} entity="tables" columns={table.columns} />
            </div>
          )}
        </For>
        <Show when={getSchemaEntity('views').length > 0}>
          <div class="text-xs font-bold py-1">{t('sidebar.views')}</div>
          <For each={getSchemaEntity('views')}>
            {(table) => (
              <div class="min-w-full w-fit">
                <TableColumnsCollapse title={table.name} entity="views" columns={table.columns} />
              </div>
            )}
          </For>
        </Show>
        <Menu id={routine_menu} animation={animation.fade} theme={'dark'}>
          <Item
            onClick={({ props }) => {
              showRoutine(getAnyCase(props.routine, 'routine_name'));
            }}>
            {t('sidebar.show_routine')}
          </Item>
          <Item
            onClick={({ props: { routine } }) => {
              showCreateStatement(getAnyCase(routine, 'routine_name'), getAnyCase(routine, 'routine_definition'));
            }}>
            {t('sidebar.show_create_statement')}
          </Item>
        </Menu>
        <Show when={getSchemaEntity('routines').length > 0}>
          <div class="text-xs font-bold py-1">{t('sidebar.routines')}</div>
          <For each={getSchemaEntity('routines')}>
            {(routine) => (
              <div class="px-2 w-fit truncate w-full hover:bg-base-100">
                <div
                  onContextMenu={(e) => {
                    hideAll();
                    show_routine_menu(e, { props: { routine } });
                  }}>
                  <span class="px-2">
                    <div
                      class="tooltip tooltip-info tooltip-right tooltip-xs"
                      data-tip={t(`sidebar.tooltips.routines`)}>
                      <Function />
                    </div>
                  </span>
                  <span class="text-xs cursor-pointer font-semibold truncate">
                    {getAnyCase(routine, 'routine_name')}
                  </span>
                </div>
              </div>
            )}
          </For>
        </Show>
        <Menu id={trigger_menu} animation={animation.fade} theme={'dark'}>
          <Item
            onClick={({ props: { trigger } }) => {
              showTrigger(getAnyCase(trigger, 'trigger_name'));
            }}>
            {t('sidebar.show_trigger')}
          </Item>
          <Item
            onClick={({ props: { trigger } }) => {
              showCreateStatement(getAnyCase(trigger, 'trigger_name'), getAnyCase(trigger, 'action_statement'));
            }}>
            {t('sidebar.show_create_statement')}
          </Item>
        </Menu>
        <Show when={getSchemaEntity('triggers').length > 0}>
          <div class="text-xs font-bold py-1">{t('sidebar.triggers')}</div>
          <For each={getSchemaEntity('triggers')}>
            {(trigger) => (
              <div class="px-2 w-fit truncate w-full hover:bg-base-100">
                <div
                  onContextMenu={(e) => {
                    hideAll();
                    show_trigger_menu(e, { props: { trigger } });
                  }}>
                  <span class="px-2">
                    <div
                      class="tooltip tooltip-info tooltip-right tooltip-xs"
                      data-tip={t(`sidebar.tooltips.triggers`)}>
                      <ShareNodes />
                    </div>
                  </span>
                  <span class="text-xs font-semibold cursor-pointer">
                    {getAnyCase(trigger, 'trigger_name') + ' (' + getAnyCase(trigger, 'event_object_table') + ')'}
                  </span>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};
