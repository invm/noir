import { DbConnectionHeader } from './db-connection-header';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from 'components/ui/sidebar';
import { DbSidebarContent } from 'pages/console/sidebar/sidebar-content';
import { SchemaSelect } from './schema-select';

interface DbSidebarProps {}

const DbSidebar = (_props: DbSidebarProps) => {
  return (
    <Sidebar>
      <SidebarHeader>
        <DbConnectionHeader />
        <SchemaSelect />
      </SidebarHeader>
      <SidebarContent>
        <DbSidebarContent />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export { DbSidebar };
