import { BsRocketTakeoff } from 'solid-icons/bs';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'components/ui/sidebar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'components/ui/hover-card';
import { useAppSelector } from 'services/Context';
import { Match, Show, Switch } from 'solid-js';
import { cn } from 'utils/cn';

interface DbConnectionProps {
  setOpen: (x: boolean) => void;
}

export function DbConnectionHeader(props: DbConnectionProps) {
  const {
    connections: { getConnection },
  } = useAppSelector();
  const conn = getConnection();

  const host = conn.connection.credentials.host;

  return (
    <HoverCard>
      <HoverCardTrigger>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => props.setOpen(true)}
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-accent transition-all flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div
                  class={cn(
                    'flex aspect-square size-8 p-2 items-center justify-center rounded-lg border',
                    `bg-${conn.connection.color}-500`
                  )}
                >
                  <BsRocketTakeoff class="size-4" />
                </div>
                <div class="flex flex-col gap-0.5 leading-none">
                  <span class="font-semibold">{conn.connection.name}</span>
                  <span class="text-xs opacity-60 overflow-hidden text-ellipsis truncate max-w-[20ch]">
                    {host}
                  </span>
                </div>
              </div>
              <kbd class="pointer-events-none p-2 py-3 rounded-lg hidden h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span class="text-xs">⌘</span>K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </HoverCardTrigger>
      <HoverCardContent class="text-xs p-2 overflow-auto w-fit">
        <table class="info-table">
          <tbody>
            <tr>
              <td class="font-bold">Connection</td>
              <td>{conn.connection.name}</td>
            </tr>
            <tr>
              <td class="font-bold">Dialect</td>
              <td>{conn.connection.dialect}</td>
            </tr>
            <tr>
              <td class="font-bold">Mode</td>
              <td>{conn.connection.mode}</td>
            </tr>
            <tr>
              <td class="font-bold">Schema</td>
              <td>{conn.selectedSchema}</td>
            </tr>
            <Switch>
              <Match when={conn.connection.mode === 'File'}>
                <tr>
                  <td class="font-bold">Path</td>
                  <td>{conn.connection.credentials.path}</td>
                </tr>
              </Match>
              <Match when={conn.connection.mode === 'Socket'}>
                <tr>
                  <td class="font-bold">Socket</td>
                  <td>{conn.connection.credentials.socket}</td>
                </tr>
              </Match>
              <Match when={!['Socket', 'File'].includes(conn.connection.mode)}>
                <tr>
                  <td class="font-bold">Host</td>
                  <td>{conn.connection.credentials.host}</td>
                </tr>
              </Match>
            </Switch>
            <Show when={conn.connection.credentials.user}>
              <tr>
                <td class="font-bold">User</td>
                <td>{conn.connection.credentials.user}</td>
              </tr>
            </Show>
          </tbody>
        </table>
      </HoverCardContent>
    </HoverCard>
  );
}
