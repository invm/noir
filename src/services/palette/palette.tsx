import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';

import { useCommandPalette } from './context';
import { For } from 'solid-js';
import { toast } from 'solid-sonner';

export const CommandPalette = () => {
  const { setOpen, open, actions } = useCommandPalette();

  return (
    <CommandDialog open={open()} onOpenChange={setOpen}>
      <CommandInput placeholder="Search all commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <For each={actions()}>
          {(action) => (
            <CommandItem
              onSelect={async () => {
                try {
                  await action.callback();
                  setOpen(false);
                } catch (error) {
                  toast.error('Could not complete action', {
                    description: (error as Error).message || (error as string),
                  });
                }
              }}
            >
              {action.label}
            </CommandItem>
          )}
        </For>
        {/* <CommandGroup heading="Suggestions"> */}
        {/* </CommandGroup> */}
        {/* <CommandItem>Show Table Data</CommandItem> */}
        {/* <CommandItem>Export Results</CommandItem> */}
      </CommandList>
    </CommandDialog>
  );
};
