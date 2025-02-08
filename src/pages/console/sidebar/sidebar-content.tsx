import { TableColumnsCollapse } from './table-collapse';
import { useAppSelector } from 'services/Context';
import { createMemo, For, JSX, Match, Switch } from 'solid-js';
import { RiEditorFunctions as Function } from 'solid-icons/ri';
import { BsShare as ShareNodes } from 'solid-icons/bs';
import { invoke } from '@tauri-apps/api';
import { ResultSet, Row, Table } from 'interfaces';
import { newContentTab } from 'services/Connections';
import { getAnyCase } from 'utils/utils';
import { VList } from 'virtua/solid';
import { createStore } from 'solid-js/store';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from 'components/ui/sidebar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'src/components/ui/popover';
import { t } from 'i18next';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from 'components/ui/context-menu';

type VListCategory = {
  title: string;
} & (
  | {
      type: 'tables';
      tables: Table[];
    }
  | {
      type: 'trigger' | 'routine';
      accessKey: string;
      rows: Row[];
      icon: () => JSX.Element;
      name: (row: Row) => string;
      show: (row: Row) => void;
      statement: (row: Row) => void;
    }
);

export const DbSidebarContent = () => {
  const {
    messages: { notify },
    connections: {
      getConnection,
      addContentTab,
      getSchemaEntity,
      refreshEntities,
    },
  } = useAppSelector();
  const [itemCollapseState, setItemCollapseState] = createStore<
    Record<string, boolean>
  >({});
  const tables = createMemo(() => getSchemaEntity('tables'));
  const views = createMemo(() => getSchemaEntity('views'));
  const routines = createMemo(() => getSchemaEntity('routines'));
  const triggers = createMemo(() => getSchemaEntity('triggers'));

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
    <VList
      class="pb-16 no-scrollbar"
      data={
        [
          {
            title: 'Tables',
            type: 'tables',
            tables: tables(),
          },
          {
            title: 'Views',
            type: 'tables',
            tables: views(),
          },
          {
            title: 'Routines',
            type: 'routine',
            rows: routines(),
            icon: () => <Function class="size-4 text-emerald-500" />,
            name: (row: Row) => getAnyCase(row, 'routine_name'),
            show: (row: Row) => showRoutine(getAnyCase(row, 'routine_name')),
            statement: (row: Row) =>
              showCreateStatement(
                getAnyCase(row, 'routine_name'),
                getAnyCase(row, 'routine_definition')
              ),
          },
          {
            title: 'Triggers',
            type: 'trigger',
            rows: triggers(),
            icon: () => <ShareNodes class="size-4 text-yellow-500" />,
            show: (row: Row) => showTrigger(getAnyCase(row, 'trigger_name')),
            statement: (row: Row) =>
              showCreateStatement(
                getAnyCase(row, 'trigger_name'),
                getAnyCase(row, 'action_statement')
              ),
            name: (row: Row) =>
              getAnyCase(row, 'trigger_name') +
              (getAnyCase(row, 'event_object_table')
                ? ' (' + getAnyCase(row, 'event_object_table') + ')'
                : ''),
          },
        ] as VListCategory[]
      }
    >
      {(entity) => (
        <SidebarGroup class="h-full py-0">
          <SidebarGroupLabel class="gap-2 p-0 font-semibold text-sm">
            {entity.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Switch>
              <Match when={entity.type === 'tables'}>
                <For each={entity.type === 'tables' && entity.tables}>
                  {(table) => (
                    <div class="min-w-full">
                      <TableColumnsCollapse
                        name={table.name}
                        entity="tables"
                        columns={table.columns}
                        refresh={refreshEntities}
                        open={itemCollapseState['t_' + table.name]}
                        onOpen={() =>
                          setItemCollapseState((state) => ({
                            ...state,
                            ['t_' + table.name]: !state['t_' + table.name],
                          }))
                        }
                      />
                    </div>
                  )}
                </For>
              </Match>
              <Match when={entity.type !== 'tables'}>
                <For each={entity.type !== 'tables' && entity.rows}>
                  {(row) => (
                    <Popover>
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <PopoverTrigger
                            class="flex w-full gap-2 items-center p-1 hover:bg-accent rounded-sm"
                            as="div"
                          >
                            {entity.type !== 'tables' && entity.icon()}
                            <span class="text-xs cursor-pointer font-semibold truncate">
                              {entity.type !== 'tables' && entity.name(row)}
                            </span>
                          </PopoverTrigger>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => {
                              entity.type !== 'tables' && entity.show(row);
                            }}
                          >
                            {t('sidebar.show_' + entity.type)}
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() =>
                              entity.type !== 'tables' && entity.statement(row)
                            }
                          >
                            {t('sidebar.show_create_statement')}
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                      <PopoverContent class="min-w-fit">
                        <div class="flex overflow-auto w-full pt-6 justify-between items-center border-b">
                          <span class="text-xs font-semibold">
                            {entity.type !== 'tables' && entity.name(row)}
                          </span>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </For>
              </Match>
            </Switch>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </VList>
  );
};
