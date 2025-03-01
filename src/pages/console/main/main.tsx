import { VsClose as X } from 'solid-icons/vs';
import { VsSettings } from 'solid-icons/vs';
import { RiDesignLayoutLeftLine as PanelLeft } from 'solid-icons/ri';
import { Button } from 'components/ui/button';
import { Separator } from 'components/ui/separator';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { For, Match, Show, Switch } from 'solid-js';
import { useSideBar } from 'components/ui/sidebar';
import { useAppSelector } from 'services/Context';
import { useNavigate } from '@solidjs/router';
import { Content } from 'pages/console/main/content/Content';
import { Kbd } from 'components/ui/kbd';

export function Main() {
  const {
    connections: {
      setContentIdx,
      getConnection,
      addContentTab,
      removeContentTab,
    },
  } = useAppSelector();

  const conn = getConnection();
  const navigate = useNavigate();

  const { toggleSidebar } = useSideBar();

  return (
    <div class="flex h-full flex-col text-foreground">
      <div class="flex w-full items-center justify-between border-b relative">
        <Tooltip>
          <TooltipTrigger
            variant="ghost"
            size="icon"
            class="h-8 w-8 mx-2"
            onClick={toggleSidebar}
            as={Button}
          >
            <PanelLeft class="size-4" />
            <span class="sr-only">Toggle Sidebar</span>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" class="h-4" />
        <div class="w-full min-w-0 overflow-hidden">
          <Tabs
            value={`${conn.idx}`}
            class="rounded-md overflow-auto no-scrollbar w-full "
          >
            <TabsList class="h-10 gap-2 rounded-none p-0 px-2 bg-background">
              <For each={conn.tabs}>
                {(tab, idx) => (
                  <TabsTrigger
                    value={idx().toString()}
                    class="gap-2 text-sm px-2 text-muted-foreground w-fit max-w-[200px]"
                    onClick={() => {
                      setContentIdx(idx());
                    }}
                  >
                    <div class="flex group items-center rounded-lg h-8 border px-0 gap-2 border-transparent ">
                      <span
                        classList={{
                          'text-primary': conn.idx === idx(),
                        }}
                        class="group-hover:text-primary transition-all max-w-[20ch] px-2 overflow-ellipsis truncate"
                      >
                        {tab.label}
                      </span>
                      <Show when={idx() > 0}>
                        <Tooltip>
                          <TooltipTrigger>
                            <span
                              class="group rounded-lg"
                              onClick={() => removeContentTab(idx())}
                            >
                              <X class="size-4 hover:text-destructive" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent class="flex items-center gap-4">
                            <Switch>
                              <Match when={conn.idx === idx()}>
                                <>
                                  Close current tab
                                  <Kbd key="W" />
                                </>
                              </Match>
                              <Match when={conn.idx !== idx()}>Close tab</Match>
                            </Switch>
                          </TooltipContent>
                        </Tooltip>
                      </Show>
                    </div>
                  </TabsTrigger>
                )}
              </For>
              <TabsIndicator class="!text-primary border !border-primary hover:border-primary px-0 rounded-lg" />
              <Button
                size="sm"
                variant="outline"
                class="flex gap-2 items-center  hover:border-primary rounded-lg"
                onClick={() => addContentTab()}
              >
                <span>New query</span>
                <Kbd key="T" />
              </Button>
            </TabsList>
          </Tabs>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <Tooltip>
          <TooltipTrigger
            class="h-8 w-8 mx-2"
            variant="ghost"
            size="icon"
            as={Button}
            onClick={() => navigate('/settings')}
          >
            <VsSettings class="size-4" />
            <span class="sr-only">Settings</span>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
      <div class="size-full">
        <Content />
      </div>
    </div>
  );
}
