import { createSignal, For, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { TbTable as Table } from 'solid-icons/tb';
import { TbArrowsMoveVertical } from 'solid-icons/tb';
import {
  newContentTab,
  TableStructureContentTabData,
} from 'services/Connections';
import { Column, ResultSet } from 'interfaces';
import { getAnyCase } from 'utils/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'src/components/ui/popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from 'components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'components/ui/alert-dialog';
import { titleCase } from 'utils/formatters';

type TableColumnsCollapseProps = {
  entity: 'views' | 'tables';
  name: string;
  columns: Column[];
  refresh: () => Promise<void>;
  open: boolean;
  onOpen: () => void;
};

export const TableColumnsCollapse = (props: TableColumnsCollapseProps) => {
  const table = props.name;
  const [dialogAction, setDialogAction] = createSignal<
    'drop' | 'truncate' | ''
  >('');

  const {
    connections: {
      insertColumnName,
      addContentTab,
      getConnection,
      updateContentTab,
    },
    backend: { selectAllFrom },
    messages: { notify },
  } = useAppSelector();

  const addTableStructureTab = async (table: string) => {
    try {
      const data = await invoke<TableStructureContentTabData>(
        'get_table_structure',
        {
          connId: getConnection().id,
          table,
        }
      );
      addContentTab(newContentTab(table, 'TableStructure', data));
    } catch (error) {
      notify(error);
    }
  };

  const listData = async () => {
    try {
      const conn = getConnection();
      const data = { result_sets: [], table };
      addContentTab(newContentTab(table, 'Data', data));
      const result_sets = await selectAllFrom(table, conn.id, conn.idx);
      updateContentTab('data', {
        result_sets: result_sets.map((id) => ({ id, loading: true })),
      });
    } catch (error) {
      notify(error);
    }
  };

  const dropTable = async () => {
    try {
      const query = `DROP ${props.entity === 'views' ? 'VIEW' : 'TABLE'} ${table}`;
      await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
      });
      notify(t('sidebar.table_was_dropped', { table }), 'success');
      await props.refresh();
    } catch (error) {
      notify(error);
    }
  };

  const truncateTable = async () => {
    try {
      const query = 'TRUNCATE TABLE ' + table;
      await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
      });
      notify(t('sidebar.table_was_truncated', { table }), 'success');
    } catch (error) {
      notify(error);
    }
  };

  const acceptAction = () => {
    if (dialogAction() === 'drop') {
      dropTable();
    } else if (dialogAction() === 'truncate') {
      truncateTable();
    }
  };

  return (
    <>
      <AlertDialog>
        <Collapsible open={props.open} class="w-full">
          <CollapsibleTrigger class="w-full">
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  onClick={props.onOpen}
                  class="cursor-pointer rounded-sm h-5 w-full flex items-center group hover:bg-accent"
                >
                  <div class="flex items-center justify-between w-full p-1">
                    <div class="flex items-center gap-2">
                      <Table
                        class={
                          props.entity === 'tables'
                            ? 'text-sky-500'
                            : 'text-orange-500'
                        }
                      />
                      <span tabindex={0} class="text-xs font-semibold">
                        {props.name}
                      </span>
                    </div>
                    <TbArrowsMoveVertical class="size-4" />
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    addTableStructureTab(props.name);
                  }}
                >
                  {t('sidebar.show_table_structure')}
                </ContextMenuItem>
                <ContextMenuItem onClick={listData}>
                  {t('sidebar.view_data')}
                </ContextMenuItem>
                <Show when={props.entity === 'tables'}>
                  <AlertDialogTrigger class="w-full">
                    <ContextMenuItem
                      onSelect={() => setDialogAction('truncate')}
                    >
                      {t('sidebar.truncate_table')}
                    </ContextMenuItem>
                  </AlertDialogTrigger>
                </Show>
                <AlertDialogTrigger class="w-full">
                  <ContextMenuItem onSelect={() => setDialogAction('drop')}>
                    {t('sidebar.drop_table')}
                  </ContextMenuItem>
                </AlertDialogTrigger>
              </ContextMenuContent>
            </ContextMenu>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-1" classList={{ 'mb-2': props.open }}>
              <Show when={props.open}>
                <For each={props.columns}>
                  {(column) => (
                    <Popover>
                      <PopoverTrigger
                        onClick={() => insertColumnName(column.name)}
                        class="flex w-full justify-between items-center border-b"
                        as="div"
                      >
                        <span class="text-xs font-semibold truncate text-ellipsis">
                          {column.name}
                        </span>
                        <div class="flex-1 flex justify-end">
                          <span class="text-xs font-light max-w-[20ch] truncate">
                            {getAnyCase(column.props, 'column_type')}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent class="min-w-fit">
                        <div class="flex overflow-auto w-full pt-6 justify-between items-center border-b">
                          <span class="text-xs font-semibold">
                            {column.name}
                          </span>
                          <div class="flex-1 flex justify-end">
                            <span class="text-xs font-light ml-2">
                              {getAnyCase(column.props, 'column_type')}
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </For>
              </Show>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {titleCase(dialogAction())} {props.name} table
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {dialogAction()} the {props.name} table?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>Cancel</AlertDialogClose>
            <AlertDialogAction
              onClick={acceptAction}
              class="bg-destructive text-destructive-foreground"
            >
              {titleCase(dialogAction())}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
