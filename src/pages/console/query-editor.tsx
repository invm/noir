import {
  FaSolidDownload as Download,
  FaSolidPlay as Play,
} from 'solid-icons/fa';
import { VsClose as X } from 'solid-icons/vs';
import { BiRegularLoaderCircle as Loader } from 'solid-icons/bi';
import {
  RiDesignLayoutLeftLine as PanelLeft,
  RiDeviceSave2Fill as Save,
} from 'solid-icons/ri';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Separator } from 'components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { createStore } from 'solid-js/store';
import { createSignal, For } from 'solid-js';
import { useSideBar } from 'components/ui/sidebar';
import Resizable from '@corvu/resizable';

interface QueryTab {
  id: string;
  name: string;
  content: string;
}

export default function QueryEditor() {
  const [tabs, setTabs] = createStore<QueryTab[]>([
    { id: '1', name: 'Query 1', content: 'SELECT * FROM users;' },
    { id: '2', name: 'media_types', content: 'SELECT * FROM media_types;' },
    { id: '3', name: 'invoices', content: 'SELECT * FROM invoices;' },
    { id: '4', name: 'Query 1', content: 'SELECT * FROM users;' },
    { id: '5', name: 'media_types', content: 'SELECT * FROM media_types;' },
    { id: '6', name: 'invoices', content: 'SELECT * FROM invoices;' },
    { id: '7', name: 'Query 1', content: 'SELECT * FROM users;' },
    { id: '8', name: 'media_types', content: 'SELECT * FROM media_types;' },
    { id: '9', name: 'invoices', content: 'SELECT * FROM invoices;' },
    { id: '10', name: 'Query 1', content: 'SELECT * FROM users;' },
    { id: '11', name: 'media_types', content: 'SELECT * FROM media_types;' },
    { id: '12', name: 'invoices', content: 'SELECT * FROM invoices;' },
  ]);
  const [activeTab, setActiveTab] = createSignal(tabs[0].id);
  const [isLoading, setIsLoading] = createSignal(false);
  const [limit, setLimit] = createSignal('100');
  const { toggleSidebar } = useSideBar();

  const closeTab = (tabId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (tabs.length > 1) {
      const newTabs = tabs.filter((tab) => tab.id !== tabId);
      setTabs(newTabs);
      if (activeTab() === tabId) {
        setActiveTab(newTabs[0].id);
      }
    }
  };

  const runQuery = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div class="flex h-full flex-col text-foreground">
      <div class="flex w-full items-center justify-between border-b px-2 relative">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              onClick={toggleSidebar}
            >
              <PanelLeft class="size-4" />
              <span class="sr-only">Toggle Sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" class="mx-2 h-4" />
        <div class="flex-1 min-w-0 overflow-hidden ">
          <Tabs
            value={activeTab()}
            onChange={(e) => setActiveTab(e)}
            class="rounded-md overflow-auto no-scrollbar"
          >
            <TabsList class="h-10 gap-1 rounded-none bg-transparent p-0 ">
              <For each={tabs}>
                {(tab) => (
                  <div
                    class="flex items-center rounded-lg transition-all border border-transparent"
                    classList={{
                      'bg-accent !border-primary': tab.id == activeTab(),
                    }}
                  >
                    <TabsTrigger
                      value={tab.id}
                      class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-muted-foreground"
                      classList={{ '!text-primary': tab.id == activeTab() }}
                    >
                      {tab.name} {tab.id}
                    </TabsTrigger>
                    <span
                      onClick={(e) => closeTab(tab.id, e)}
                      class="hover:text-destructive p-1 rounded-lg"
                    >
                      <X class="size-4" />
                    </span>
                  </div>
                )}
              </For>
            </TabsList>
          </Tabs>
        </div>
        <Separator orientation="vertical" class="mx-2 h-4" />
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              onClick={toggleSidebar}
            >
              <PanelLeft class="size-4" />
              <span class="sr-only">Toggle Sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>
      </div>
      <div class="flex items-center gap-2 border-b bg-muted/40 px-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={runQuery}
          disabled={isLoading()}
        >
          {isLoading() ? (
            <Loader class="mr-2 size-4 animate-spin" />
          ) : (
            <Play class="mr-2 size-4" />
          )}
          Run
        </Button>
        <Button size="sm" variant="ghost">
          <Save class="mr-2 size-4" />
          Save
        </Button>
        <Button size="sm" variant="ghost">
          <Download class="mr-2 size-4" />
          Export
        </Button>
        <div class="flex items-center">
          <span class="mr-2 text-sm">Limit:</span>
          <Input
            type="number"
            value={limit()}
            onChange={(e) => setLimit(e.target.value)}
            class="h-8 w-20"
          />
        </div>
        {isLoading() && (
          <div class="ml-auto flex items-center">
            <Loader class="mr-2 size-4 animate-spin" />
            <span class="text-sm">Running query...</span>
          </div>
        )}
      </div>
      <div class="size-full">
        <Resizable class="size-full" orientation="vertical">
          <Resizable.Panel
            initialSize={0.4}
            minSize={0.3}
            collapsible
            collapsedSize={0.1}
            class="flex items-center justify-center overflow-hidden rounded-lg bg-corvu-100"
          >
            <Tabs value={activeTab()} class="flex-1 flex">
              <For each={tabs}>
                {(tab) => (
                  <TabsContent
                    value={tab.id}
                    class="h-full flex-col flex-1 border-0 p-0 data-[state=active]:flex data-[state=active]:flex-col"
                  >
                    <textarea
                      class="h-full w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none"
                      value={tab.content}
                      onChange={(e) => {
                        const newTabs = tabs.map((t) =>
                          t.id === tab.id
                            ? { ...t, content: e.target.value }
                            : t
                        );
                        setTabs(newTabs);
                      }}
                    />
                  </TabsContent>
                )}
              </For>
            </Tabs>
          </Resizable.Panel>
          <Resizable.Handle
            aria-label="Resize Handle"
            class="group basis-2 px-2 overflow-hidden"
          >
            <div class="size-full bg-accent active:bg-primary hover:bg-primary rounded-lg transition-colors group-data-active:bg-corvu-300 group-data-dragging:bg-corvu-100" />
          </Resizable.Handle>
          <Resizable.Panel
            collapsible
            initialSize={0.6}
            minSize={0.3}
            collapsedSize={0.1}
            class="rounded-lg bg-corvu-100"
          >
            <Tabs value={activeTab()} class="flex-1 flex">
              <For each={tabs}>
                {(tab) => (
                  <TabsContent
                    value={tab.id}
                    class="h-full flex-col flex-1 border-0 p-0 data-[state=active]:flex data-[state=active]:flex-col"
                  >
                    <textarea
                      class="h-full w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none"
                      value={tab.content}
                      onChange={(e) => {
                        const newTabs = tabs.map((t) =>
                          t.id === tab.id
                            ? { ...t, content: e.target.value }
                            : t
                        );
                        setTabs(newTabs);
                      }}
                    />
                  </TabsContent>
                )}
              </For>
            </Tabs>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  );
}
