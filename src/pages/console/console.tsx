import { useHead } from 'utils/use-head';
import { invoke } from '@tauri-apps/api/core';
import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';
import { Main } from './main/main';
import { DbSidebar } from 'pages/console/sidebar/db-sidebar';
import { useNavigate } from '@solidjs/router';
import { useAppSelector } from 'services/Context';
import { createEffect, Show } from 'solid-js';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { Action } from 'services/palette/context';
import { Kbd } from 'components/ui/kbd';

export const Console = () => {
  const {
    connections: {
      getConnection,
      removeConnection,
      addContentTab,
      removeCurrentContentTab,
    },
  } = useAppSelector();
  const current = getConnection();
  const getConnId = useHead();
  const navigate = useNavigate();

  createEffect(() => {
    if (!current.id) {
      navigate('/connections');
    }
  });

  const editorActions: Action[] = [
    {
      id: 'disconnect',
      label: 'Disconnect from current db',
      callback: async () => {
        const id = getConnId();
        await invoke<string>('disconnect', { id });
        await removeConnection(id);
        navigate('/');
      },
    },
    {
      id: 'new-query-tab',
      label: 'New query',
      callback: addContentTab,
      shortcut: <Kbd key={'T'} />,
    },
    {
      id: 'close-current-tab',
      label: 'Close current tab',
      callback: removeCurrentContentTab,
      shortcut: <Kbd key={'W'} />,
    },
  ];

  return (
    <Show when={getConnection()?.id} keyed>
      <CommandPaletteContextWrapper actions={editorActions}>
        <SidebarProvider>
          <DbSidebar />
          <SidebarInset class="bg-background h-screen w-screen">
            <Main />
          </SidebarInset>
        </SidebarProvider>
      </CommandPaletteContextWrapper>
    </Show>
  );
};
