import { DbConnectionHeader } from './db-connection-header';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from 'components/ui/sidebar';
import { createSignal } from 'solid-js';

import { CommandPalette } from 'components/command-palette';
import { DbSidebarContent } from 'pages/console/sidebar/sidebar-content';
import { SchemaSelect } from './schema-select';

interface DbSidebarProps {}

const DbSidebar = (_props: DbSidebarProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <Sidebar>
      <SidebarHeader>
        <DbConnectionHeader setOpen={setOpen} />
        <SchemaSelect />
        <CommandPalette setOpen={setOpen} open={open} />
      </SidebarHeader>
      <SidebarContent>
        <DbSidebarContent />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export { DbSidebar };
