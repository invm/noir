import {
  FaSolidChevronRight as ChevronRight,
  FaSolidDatabase as Database,
  FaSolidKey as Key,
  FaSolidTable as Table,
} from 'solid-icons/fa';
import { IoTimerSharp as Trigger } from 'solid-icons/io';

import { DbConnectionHeader } from './db-connection-header';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from 'components/ui/sidebar';
import { For } from 'solid-js';

// Sample data structure with more detailed tables
const data = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'email', type: 'varchar(255)' },
        { name: 'name', type: 'varchar(100)' },
        { name: 'age', type: 'integer' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'user_id', type: 'uuid' },
        { name: 'total', type: 'decimal(10,2)' },
        { name: 'status', type: 'varchar(50)' },
        { name: 'order_date', type: 'date' },
        { name: 'shipped_date', type: 'date' },
      ],
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'name', type: 'varchar(200)' },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'decimal(10,2)' },
        { name: 'stock', type: 'integer' },
        { name: 'category', type: 'varchar(100)' },
      ],
    },
  ],
  triggers: [
    { name: 'update_user_timestamp', table: 'users' },
    { name: 'notify_new_order', table: 'orders' },
    { name: 'update_stock', table: 'products' },
  ],
  routines: [
    { name: 'get_user_stats', type: 'function' },
    { name: 'process_order', type: 'procedure' },
    { name: 'calculate_total_revenue', type: 'function' },
  ],
};

const DbSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <DbConnectionHeader name="sample_db" host="localhost:5432" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Database Objects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Tables Section */}
              <SidebarMenuItem class="mb-2">
                <SidebarMenuButton>
                  <Table class="mr-2 size-4" />
                  <span>Tables</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <For each={data.tables}>
                {(table) => (
                  <Collapsible>
                    <SidebarMenuItem class="pl-4 mb-0.5">
                      <CollapsibleTrigger>
                        <SidebarMenuButton>
                          <ChevronRight class="mr-2 size-4" />
                          <span>{table.name}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <div class="pl-8 pr-4 py-1">
                        <div class="grid grid-cols-[1fr,1fr] gap-x-4 text-xs">
                          <div class="font-medium text-muted-foreground">
                            Column
                          </div>
                          <div class="font-medium text-muted-foreground">
                            Type
                          </div>
                          <For each={table.columns}>
                            {(column) => (
                              <div>
                                <div class="py-1 flex items-center">
                                  {column.isPrimary && (
                                    <Key class="mr-2 size-3" />
                                  )}
                                  {column.name}
                                </div>
                                <div class="py-1 text-muted-foreground">
                                  {column.type}
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </For>
              {/* Triggers Section */}
              <SidebarMenuItem class="mt-4 mb-2">
                <SidebarMenuButton>
                  <Trigger class="mr-2 size-4" />
                  <span>Triggers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {data.triggers.map((trigger) => (
                <SidebarMenuItem class="pl-4">
                  <SidebarMenuButton>
                    <span>{trigger.name}</span>
                    <span class="ml-auto opacity-50">{trigger.table}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Routines Section */}
              <SidebarMenuItem class="mt-4 mb-2">
                <SidebarMenuButton>
                  <Database class="mr-2 size-4" />
                  <span>Routines</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {data.routines.map((routine) => (
                <SidebarMenuItem class="pl-4">
                  <SidebarMenuButton>
                    <span>{routine.name}</span>
                    <span class="ml-auto opacity-50">{routine.type}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export { DbSidebar };
