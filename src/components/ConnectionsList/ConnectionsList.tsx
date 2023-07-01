import { invoke } from '@tauri-apps/api';
import { For, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ConnectionConfig } from '../../interfaces';
import { ConnectionItem } from './ConnectionItem/ConnectionItem';

export const ConnectionsList = () => {
  const [connections, setConnections] = createStore<ConnectionConfig[]>([]);

  onMount(async () => {
    const res = await invoke('get_connections', {})
    setConnections(res as ConnectionConfig[]);
  });

  const deleteConnection = async (id: string) => {
    await invoke('delete_connection', { id })
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div class="p-2 bg-gray-900">
      <h3 class="text px-2 text-xl font-bold">Saved Connections</h3>
      <div class="divider my-0"></div>
      <ul class="grid grid-cols-1 gap-1">
        <For each={connections}>
          {(connection) =>
            <li>
              <ConnectionItem {...{ connection, deleteConnection }} />
            </li>
          }
        </For>
      </ul>
    </div>

  )
}
