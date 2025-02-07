import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command';

import { Accessor, createEffect, Setter } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { createShortcut } from '@solid-primitives/keyboard';
import { useHead } from 'utils/use-head';
import { invoke } from '@tauri-apps/api';
import { useNavigate } from '@solidjs/router';

interface CommandPaletteProps {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}

export const CommandPalette = (props: CommandPaletteProps) => {
  const {
    connections: { removeConnection, store },
    app: { cmdOrCtrl },
  } = useAppSelector();

  const close = () => props.setOpen(false);
  const getConnId = useHead();
  const navigate = useNavigate();

  createEffect(() => {
    createShortcut([cmdOrCtrl(), 'k'], () => {
      props.setOpen((open) => !open);
    });
  }, []);

  const handleCloseConnection = async () => {
    const id = getConnId();
    console.log('id', id);
    await invoke<string>('disconnect', { id });
    await removeConnection(id);
    navigate('/');
    console.log(store.connections, id);
    // if (store.tabs.length === 0) {
    // }
  };
  return (
    <CommandDialog open={props.open()} onOpenChange={props.setOpen}>
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
