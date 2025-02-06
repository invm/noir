import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';

import { createEffect, createSignal } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { createShortcut } from '@solid-primitives/keyboard';
import { useHead } from 'utils/use-head';
import { invoke } from '@tauri-apps/api';
import { useNavigate } from '@solidjs/router';

interface CommandPaletteProps {}

export const CommandPalette = (_props: CommandPaletteProps) => {
  const {
    connections: { removeConnectionTab, store },
    app: { cmdOrCtrl },
  } = useAppSelector();

  const [open, setOpen] = createSignal(false);
  const close = () => setOpen(false);
  const getConnId = useHead();
  const navigate = useNavigate();

  createEffect(() => {
    createShortcut([cmdOrCtrl(), 'k'], () => {
      setOpen((open) => !open);
    });
  }, []);

  const handleCloseConnection = async () => {
    const id = getConnId();
    await invoke<string>('disconnect', { id });
    await removeConnectionTab(id);
    console.log(store.tabs);
    navigate('/');
    // if (store.tabs.length === 0) {
    // }
  };
  return (
    <CommandDialog open={open()} onOpenChange={setOpen}>
      <CommandInput placeholder="Search all commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem
            disabled={false}
            onSelect={async () => {
              await handleCloseConnection();
              close();
            }}
          >
            Disconnect from current db
          </CommandItem>
          <CommandItem>Show Table Data</CommandItem>
          <CommandItem>Export Results</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
