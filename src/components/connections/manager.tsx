import { Motion } from 'solid-motionone';
import { FaSolidPlus as Plus } from 'solid-icons/fa';
import { Button } from 'components/ui/button';
import { createSignal, Show } from 'solid-js';

import { ConnectionGrid } from './grid';
import { AddConnectionForm } from 'components/connections/form';

export function ConnectionManager() {
  const [showNewConnection, setShowNewConnection] = createSignal(true);

  return (
    <div class="mx-auto max-w-7xl h-full overflow-hidden pt-10">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Database Connections</h1>
          <p class="text-muted-foreground">Manage your database connections</p>
        </div>
        <Button onClick={() => setShowNewConnection(!showNewConnection())}>
          <Plus class="mr-2 h-4 w-4" />
          New Connection
        </Button>
      </div>

      <div class="flex space-x-8 h-full">
        <div class={'flex-1 min-h-0 overflow-auto pb-32 no-scrollbar'}>
          <ConnectionGrid
            class={showNewConnection() ? 'grid-cols-1' : 'grid-cols-2'}
          />
        </div>

        <Show when={showNewConnection()}>
          <Motion.div
            class="flex-1"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
          >
            <AddConnectionForm onClose={() => setShowNewConnection(false)} />
          </Motion.div>
        </Show>
      </div>
    </div>
  );
}
