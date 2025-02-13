import { useHead } from 'utils/use-head';
import { invoke } from '@tauri-apps/api';
import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';
import { QueryEditor } from './main/query-editor';
import { DbSidebar } from 'pages/console/sidebar/db-sidebar';
import { useNavigate } from '@solidjs/router';
import { useAppSelector } from 'services/Context';
import { createEffect, Show } from 'solid-js';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { CommandPaletteAction } from 'services/palette/context';

export const Console = () => {
  const {
    connections: { getConnection, removeConnection },
  } = useAppSelector();
  const current = getConnection();
  const getConnId = useHead();
  const navigate = useNavigate();

  createEffect(() => {
    if (!current.id) {
      navigate('/connections');
    }
  });

  const editorActions: CommandPaletteAction[] = [
    {
      id: 'disconnect',
      label: 'Disconnect from current db',
      group: 'console',
      callback: async () => {
        const id = getConnId();
        await invoke<string>('disconnect', { id });
        await removeConnection(id);
        navigate('/');
      },
    },
  ];

  return (
    <Show when={getConnection()?.id} keyed>
      <CommandPaletteContextWrapper actions={editorActions}>
        <SidebarProvider>
          <DbSidebar />
          <SidebarInset class="bg-background">
            <QueryEditor />
          </SidebarInset>
        </SidebarProvider>
      </CommandPaletteContextWrapper>
    </Show>
  );
};
