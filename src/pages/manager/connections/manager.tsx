import { Motion } from 'solid-motionone';
import { FaSolidPlus as Plus } from 'solid-icons/fa';
import { Button } from 'components/ui/button';
import { createSignal, Show } from 'solid-js';
import { VsSettings } from 'solid-icons/vs';

import { ConnectionGrid } from './grid';
import { AddConnectionForm } from 'pages/manager/connections/form';
import { A } from '@solidjs/router';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';

export function ConnectionManager() {
  const [showNewConnection, setShowNewConnection] = createSignal(false);

  return (
    <div class="mx-auto container h-full overflow-hidden pt-10">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Database Connections</h1>
          <p class="text-muted-foreground">Manage your database connections</p>
        </div>
        <div class="flex gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Button href="/settings" as={A}>
                <VsSettings />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <Button onClick={() => setShowNewConnection(!showNewConnection())}>
            <Plus class="mr-2 h-4 w-4" />
            New Connection
          </Button>
        </div>
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
