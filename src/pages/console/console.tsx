import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';
import { QueryEditor } from './main/query-editor';
import { DbSidebar } from 'pages/console/sidebar/db-sidebar';
import { useNavigate } from '@solidjs/router';
import { useAppSelector } from 'services/Context';
import { createEffect, Show } from 'solid-js';

export const Console = () => {
  const {
    connections: { getConnection },
  } = useAppSelector();
  const current = getConnection();
  const navigate = useNavigate();

  createEffect(() => {
    if (!current.id) {
      navigate('/connections');
    }
  });

  return (
    <Show when={current?.id}>
      <SidebarProvider>
        <DbSidebar />
        <SidebarInset class="bg-background">
          <QueryEditor />
        </SidebarInset>
      </SidebarProvider>
    </Show>
  );
};
