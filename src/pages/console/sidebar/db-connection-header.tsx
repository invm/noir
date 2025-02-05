import { ImCommand as Command } from 'solid-icons/im';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'components/ui/sidebar';
import { createEffect, createSignal } from 'solid-js';

interface DbConnectionProps {
  name: string;
  host: string;
  color?: string;
}

export function DbConnectionHeader({
  name,
  host,
  color = '#4f46e5',
}: DbConnectionProps) {
  const [open, setOpen] = createSignal(false);

  createEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setOpen(true)}
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg"
              style={{ 'background-color': color }}
            >
              <Command class="size-4 text-white" />
            </div>
            <div class="flex flex-col gap-0.5 leading-none">
              <span class="font-semibold">{name}</span>
              <span class="text-xs opacity-60">{host}</span>
            </div>
            <kbd class="pointer-events-none absolute right-2 top-[50%] hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span class="text-xs">⌘</span>K
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <CommandDialog open={open()} onOpenChange={setOpen}>
        <CommandInput placeholder="Search all commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>New Query</CommandItem>
            <CommandItem>Show Table Data</CommandItem>
            <CommandItem>Export Results</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
