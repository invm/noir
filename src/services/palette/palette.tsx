import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';

import { useCommandPalette } from './context';
import { For, Show } from 'solid-js';
import { toast } from 'solid-sonner';

export const CommandPalette = () => {
  const { setOpen, open, actions, groups } = useCommandPalette();

  return (
    <CommandDialog open={open()} onOpenChange={setOpen}>
      <CommandInput placeholder="Search all commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <For each={groups()}>
          {(group) => (
            <Show when={group.actions.length}>
              <CommandGroup heading={group.label}>
                <For each={group.actions}>
                  {(action) => (
                    <CommandItem
                      onSelect={async () => {
                        try {
                          await action.callback();
                          setOpen(false);
                        } catch (error) {
                          toast.error('Could not complete action', {
                            description:
                              (error as Error).message || (error as string),
                          });
                        }
                      }}
                    >
                      {action.label}
                    </CommandItem>
                  )}
                </For>
              </CommandGroup>
            </Show>
          )}
        </For>
        <CommandGroup>
          <For each={actions()}>
            {(action) => (
              <CommandItem
                onSelect={async () => {
                  try {
                    await action.callback();
                    setOpen(false);
                  } catch (error) {
                    toast.error('Could not complete action', {
                      description:
                        (error as Error).message || (error as string),
                    });
                  }
                }}
              >
                {action.label}
              </CommandItem>
            )}
          </For>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
