import { QueryEditor } from 'components/editor/query-editor';
import { DbSidebar } from 'components/sidebar/db-sidebar';
import ThemeCustomizer from 'components/theme-customizer';
import { SidebarInset, SidebarProvider } from 'components/ui/sidebar';

export const Console = () => {
  return (
    <SidebarProvider>
      <DbSidebar />
      <SidebarInset class="bg-background">
        <QueryEditor />
        <ThemeCustomizer />
      </SidebarInset>
    </SidebarProvider>
  );
};
