import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';
import { DbSidebar } from 'components/sidebar/db-sidebar';
import QueryEditor from '../components/query-editor';

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
