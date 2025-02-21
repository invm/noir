import { invoke } from '@tauri-apps/api';
import { Button } from 'components/ui/button';
import { BsTerminalFill as Terminal } from 'solid-icons/bs';
import { IoRefresh as Refresh } from 'solid-icons/io';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { ResultSet } from 'interfaces';
import { newContentTab } from 'services/Connections';
import { useAppSelector } from 'services/Context';
import { createEffect, createSignal, Match, Show, Switch } from 'solid-js';
import { t } from 'utils/i18n';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { Loader } from 'components/ui/loader';
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
import { toast } from 'solid-sonner';

export const SchemaSelect = () => {
  const {
    connections: {
      getConnection,
      updateConnectionTab,
      addContentTab,
      fetchSchemaEntities,
      updateSchemaDefinition,
      refreshEntities,
    },
  } = useAppSelector();
  const conn = getConnection();
  const [loading, setLoading] = createSignal(false);

  createEffect(async () => {
    await invoke('set_schema', {
      connId: conn.id,
      schema: conn.selectedSchema,
      dialect: conn.connection.dialect,
    });
    const { triggers, routines, tables, schemas, columns, views } =
      await fetchSchemaEntities(conn.id, conn.connection.dialect);
    updateSchemaDefinition({
      triggers,
      routines,
      columns,
      tables,
      views,
    });
    updateConnectionTab('schemas', schemas);
  });

  const showProcessList = async () => {
    setLoading(true);
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
      const data = {
        query,
        result_sets: [res],
        cursor: 0,
        auto_limit: false,
        viewState: null,
      };
      addContentTab(newContentTab(t('sidebar.process_list'), 'Query', data));
    } catch (error) {
      toast.error('Could not show process list', {
        description: (error as Error).message || (error as string),
      });
    }
    setLoading(false);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await refreshEntities();
    } catch (error) {
      toast.error('Could not refresh', {
        description: (error as Error).message || (error as string),
      });
    }
    setLoading(false);
  };

  const dropDatabase = async (schema: string) => {
    try {
      const selectedSchema = getConnection().selectedSchema;
      const query = 'DROP SCHEMA ' + schema;
      await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
      });
      if (selectedSchema === schema) {
        updateConnectionTab('selectedSchema', getConnection().schemas[0] ?? '');
      }
      await refreshEntities();
    } catch (error) {
      toast.error('Could not drop database', {
        description: (error as Error).message || (error as string),
      });
    }
  };

  return (
    <div class="flex items-center gap-2">
      <Select
        class="w-full overflow-hidden"
        options={conn.schemas}
        onChange={(schema) => {
          if (schema) updateConnectionTab('selectedSchema', schema);
        }}
        value={conn.selectedSchema}
        itemComponent={(props) => (
          <AlertDialog>
            <ContextMenu>
              <ContextMenuTrigger>
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              </ContextMenuTrigger>

              <ContextMenuContent>
                <Show when={conn.connection.dialect !== 'Sqlite'}>
                  <AlertDialogTrigger class="w-full">
                    <ContextMenuItem>Drop database</ContextMenuItem>
                  </AlertDialogTrigger>
                </Show>
              </ContextMenuContent>
            </ContextMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Drop {props.item.rawValue}</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to drop the {props.item.rawValue}{' '}
                  database ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose>Cancel</AlertDialogClose>
                <AlertDialogAction
                  onClick={() => dropDatabase(props.item.rawValue)}
                  class="bg-destructive text-destructive-foreground"
                >
                  Drop
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      >
        <SelectTrigger class="h-8 w-full p-1 flex gap-2">
          <SelectValue class="overflow-hidden w-full flex justify-start truncate">
            {(state) => state.selectedOption() as string}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
      <Show when={conn.connection.dialect !== 'Sqlite'}>
        <Tooltip>
          <TooltipTrigger
            onClick={showProcessList}
            disabled={loading()}
            variant="ghost"
            class="p-1 size-4 flex items-center"
            as={Button}
          >
            <Switch>
              <Match when={loading()}>
                <Loader />
              </Match>
              <Match when={!loading()}>
                <Terminal class="size-4" />
              </Match>
            </Switch>
          </TooltipTrigger>
          <TooltipContent>{t('sidebar.show_process_list')}</TooltipContent>
        </Tooltip>
      </Show>
      <Tooltip>
        <TooltipTrigger
          onClick={refresh}
          disabled={loading()}
          variant="ghost"
          class="p-1 size-4 flex items-center"
          as={Button}
        >
          <Switch>
            <Match when={loading()}>
              <Loader />
            </Match>
            <Match when={!loading()}>
              <Refresh class="size-4" />
            </Match>
          </Switch>
        </TooltipTrigger>
        <TooltipContent>{t('sidebar.refresh_schema')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
