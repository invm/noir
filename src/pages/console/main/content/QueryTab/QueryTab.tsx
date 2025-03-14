import { Results } from './Results';
import Resizable from '@corvu/resizable';
import { QueryEditor } from './QueryEditor';
import { useAppSelector } from 'services/Context';
import { Tabs, TabsContent } from 'components/ui/tabs';
import { For } from 'solid-js';

export const QueryTab = () => {
  const {
    connections: { getConnection },
    app: { gridTheme },
  } = useAppSelector();

  const conn = getConnection();

  return (
    <Resizable class="size-full" orientation="vertical">
      <Resizable.Panel
        initialSize={0.4}
        minSize={0.3}
        collapsible
        collapsedSize={0.2}
        class="flex items-center justify-center overflow-hidden"
      >
        <QueryEditor />
      </Resizable.Panel>
      <Resizable.Handle
        aria-label="Resize Handle"
        class="group h-2 overflow-hidden"
      >
        <div class="size-full bg-primary/30 active:bg-primary hover:bg-primary transition-colors" />
      </Resizable.Handle>
      <Resizable.Panel
        collapsible
        initialSize={0.6}
        minSize={0.3}
        collapsedSize={0.1}
        class="rounded-lg"
      >
        <Tabs value={conn.idx.toString()} class="flex-1 flex h-full">
          <For each={conn.tabs}>
            {(_tab, idx) => (
              <TabsContent
                value={idx().toString()}
                class="h-full flex-col flex-1 border-0 !m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <Results editable={false} gridTheme={gridTheme()} />
              </TabsContent>
            )}
          </For>
        </Tabs>
      </Resizable.Panel>
    </Resizable>
  );
};
