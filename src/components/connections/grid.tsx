import { Button } from 'components/ui/button';
import { FaSolidServer as Server } from 'solid-icons/fa';
// import { VsSettings as Settings2 } from 'solid-icons/vs';
import { TbPlugConnected } from 'solid-icons/tb';
import { ConnectionConfig } from 'interfaces';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import { For } from 'solid-js';
import { cn } from 'utils/cn';
import { useAppSelector } from 'services/Context';
import { invoke } from '@tauri-apps/api';
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
import { AlertDialogTriggerProps } from '@kobalte/core/alert-dialog';
import { useNavigate } from '@solidjs/router';

export function ConnectionGrid(props: { class?: string }) {
  const navigate = useNavigate();
  const {
    messages: { notify },
    connections: {
      connections,
      refreshConnections,
      addConnectionTab,
      fetchSchemaEntities,
      setLoading,
    },
  } = useAppSelector();

  const deleteConnection = async (id: string) => {
    await invoke('delete_connection', { id });
    await refreshConnections();
  };

  const onConnect = async (config: ConnectionConfig) => {
    setLoading(true);
    try {
      const selectedSchema = await invoke<string>('init_connection', {
        config,
      });
      const { triggers, columns, routines, tables, schemas, views } =
        await fetchSchemaEntities(config.id, config.dialect);
      await addConnectionTab({
        id: config.id,
        label: config.name,
        selectedSchema,
        definition: {
          [config.schema]: { columns, routines, triggers, tables, views },
        },
        schemas,
        connection: config,
        tabs: [],
        idx: 0,
      });
      navigate('/console/' + config.id);
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class={cn('grid gap-4 self-start', props.class)}>
      <For each={connections}>
        {(connection) => (
          <AlertDialog>
            <ContextMenu>
              <ContextMenuTrigger>
                <Card class="relative overflow-hidden py-2">
                  <div
                    class={`absolute left-0 top-0 h-full w-1 bg-${connection.color}-500`}
                  />
                  <CardHeader class="pb-4 py-2">
                    <CardTitle class="flex items-center text-lg">
                      <div
                        class={`mr-2 h-2 w-2 rounded-full bg-${connection.color}-500`}
                      />
                      {connection.name}
                    </CardTitle>
                    <CardDescription class="flex items-center space-x-2">
                      <Server class="h-3 w-3" />
                      <span>
                        {connection.dialect === 'Sqlite'
                          ? connection.credentials.path
                          : connection.credentials?.host}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="py-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-muted-foreground">
                        {connection.dialect}
                      </span>
                      <Button
                        onClick={() => onConnect(connection)}
                        variant="ghost"
                        size="sm"
                      >
                        <TbPlugConnected class="size-5" />
                      </Button>
                      {/* TODO: add this option */}
                      {/* <Button variant="ghost" size="sm"> */}
                      {/*   <Settings2 class="h-4 w-4" /> */}
                      {/* </Button> */}
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <AlertDialogTrigger class="w-full">
                  <ContextMenuItem>Delete</ContextMenuItem>
                </AlertDialogTrigger>
              </ContextMenuContent>
            </ContextMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  connection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose>Cancel</AlertDialogClose>
                <AlertDialogAction
                  as={(_props: AlertDialogTriggerProps) => (
                    <Button
                      onClick={() => deleteConnection(connection.id)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  )}
                ></AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </For>
    </div>
  );
}
