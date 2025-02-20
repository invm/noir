import { Motion } from 'solid-motionone';
import { FaSolidPlus as Plus } from 'solid-icons/fa';
import { Button } from 'components/ui/button';
import { createSignal, Show } from 'solid-js';
import { VsSettings } from 'solid-icons/vs';

import { ConnectionGrid } from './connections/grid';
import {
  AddConnectionForm,
  EditState,
} from 'pages/connections/connections/form';
import { A } from '@solidjs/router';
import { ConnectionConfig } from 'interfaces';
import { createStore } from 'solid-js/store';

export function ConnectionManager() {
  const [showForm, setShowForm] = createSignal(false);
  const [editConnection, setEditConnection] = createStore<EditState>({});

  const toggle = () => {
    if (showForm()) {
      setEditConnection('connection', undefined);
    }
    setShowForm(!showForm());
  };

  const onEditClick = (connection: ConnectionConfig) => {
    setEditConnection('connection', { ...connection });
    setShowForm(true);
  };

  const onReset = () => {
    setEditConnection({ connection: undefined });
    setShowForm(false);
  };

  return (
    <div class="mx-auto container h-[100vh] w-[100vw] overflow-hidden pt-10">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Database Connections</h1>
          <p class="text-muted-foreground">Manage your database connections</p>
        </div>
        <div class="flex gap-2">
          <Button href="/settings" as={A}>
            <VsSettings />
          </Button>
          <Button onClick={toggle}>
            <Plus class="mr-2 h-4 w-4" />
            New Connection
          </Button>
        </div>
      </div>

      <div class="flex space-x-4 h-full">
        <div class={'flex-1 min-h-0 overflow-auto pb-32 no-scrollbar'}>
          <ConnectionGrid
            onEditClick={onEditClick}
            class={showForm() ? 'grid-cols-1' : 'grid-cols-2'}
          />
        </div>

        <Show when={showForm()}>
          <Show when={editConnection.connection?.id || '1'} keyed>
            <Motion.div
              class="flex-1"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
            >
              <AddConnectionForm
                values={editConnection}
                onClose={() => {
                  setEditConnection({ connection: undefined });
                }}
                onReset={onReset}
              />
            </Motion.div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
