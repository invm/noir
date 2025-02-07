import { BsRocketTakeoff } from 'solid-icons/bs';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'components/ui/sidebar';

interface DbConnectionProps {
  name: string;
  host: string;
  color?: string;
  setOpen: (x: boolean) => void;
}

export function DbConnectionHeader(props: DbConnectionProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={() => props.setOpen(true)}
          class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-accent transition-all flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex aspect-square size-8 p-2 items-center justify-center rounded-lg"
              style={{ 'background-color': props.color }}
            >
              <BsRocketTakeoff class="size-4 text-white" />
            </div>
            <div class="flex flex-col gap-0.5 leading-none">
              <span class="font-semibold">{props.name}</span>
              <span class="text-xs opacity-60">{props.host}</span>
            </div>
          </div>
          <kbd class="pointer-events-none p-2 py-3 rounded-lg hidden h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span class="text-xs">⌘</span>K
          </kbd>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
