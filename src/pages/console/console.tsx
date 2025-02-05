import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';
import { DbSidebar } from './sidebar/db-sidebar';
import QueryEditor from './query-editor';

export const Console = () => {
  return (
    <SidebarProvider>
      <DbSidebar />
      <SidebarInset class="bg-background">
        <QueryEditor />
      </SidebarInset>
    </SidebarProvider>
  );
};
