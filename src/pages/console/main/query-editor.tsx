import { VsClose as X } from 'solid-icons/vs';
import { VsSettings } from 'solid-icons/vs';
import { RiDesignLayoutLeftLine as PanelLeft } from 'solid-icons/ri';
import { Button } from 'components/ui/button';
import { Separator } from 'components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { createEffect, For, Match, Show, Switch } from 'solid-js';
import { useSideBar } from 'components/ui/sidebar';
import { useAppSelector } from 'services/Context';
import { A } from '@solidjs/router';
import { Content } from 'components/Screens/Console/Content/Content';

interface QueryEditorProps {}

export function QueryEditor(_props: QueryEditorProps) {
  const {
    connections: {
      setContentIdx,
      getConnection,
      addContentTab,
      removeContentTab,
    },
  } = useAppSelector();

  const conn = getConnection();

  const { toggleSidebar } = useSideBar();

  createEffect(() => {});

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
            value={`${conn.idx}`}
            // onChange={(e) => setContentIdx(Number(e))}
            class="rounded-md overflow-auto no-scrollbar"
          >
            <TabsList class="h-10 gap-1 rounded-none bg-transparent p-0 ">
              <For each={conn.tabs}>
                {(tab, idx) => (
                  <div
                    onClick={() => setContentIdx(idx())}
                    class="flex items-center rounded-lg transition-all border px-2 gap-2 border-transparent hover:border-primary"
                    classList={{
                      'bg-accent !border-primary': conn.idx === idx(),
                    }}
                  >
                    <TabsTrigger
                      value={idx().toString()}
                      class="inline-flex items-center justify-center gap-2 py-1.5 px-0 text-sm text-muted-foreground hover:text-primary transition-all"
                      classList={{
                        '!text-primary': conn.idx === idx(),
                      }}
                    >
                      {tab.label}
                    </TabsTrigger>

                    <Show when={idx() > 0}>
                      <Tooltip>
                        <TooltipTrigger>
                          <span
                            class="group rounded-lg"
                            onClick={() => removeContentTab(idx())}
                          >
                            <X class="size-4 group-hover:text-destructive" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent class="flex items-center gap-4">
                          <Switch>
                            <Match when={conn.idx === idx()}>
                              <>
                                Close current tab
                                <kbd class="pointer-events-none p-1 rounded-md hidden h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                  <span class="text-xs">⌘</span>W
                                </kbd>
                              </>
                            </Match>
                            <Match when={conn.idx !== idx()}>Close tab</Match>
                          </Switch>
                        </TooltipContent>
                      </Tooltip>
                    </Show>
                  </div>
                )}
              </For>
              <Button
                size="sm"
                variant="outline"
                class="flex gap-2 items-center"
                onClick={() => addContentTab()}
              >
                <span>New query</span>
                <kbd class="pointer-events-none p-1 rounded-md hidden h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span class="text-xs">⌘</span>T
                </kbd>
              </Button>
            </TabsList>
          </Tabs>
        </div>
        <Separator orientation="vertical" class="mx-2 h-4" />
        <Tooltip>
          <TooltipTrigger>
            <A href="/settings">
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <VsSettings class="size-4" />
                <span class="sr-only">Settings</span>
              </Button>
            </A>
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
