import { invoke } from '@tauri-apps/api';
import { For, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ConnectionConfig } from '../../interfaces';
import { ConnectionItem } from './ConnectionItem';

export const ConnectionsList = () => {
  const [connections, setConnections] = createStore<ConnectionConfig[]>([]);

  onMount(async () => {
    const res = await invoke('get_connections', {})
    setConnections(res as ConnectionConfig[]);
  });

  const deleteConnection = async (connection: ConnectionConfig) => {
    // const res = await invoke('delete_connection', { id: connection.id })
    // console.log(res);
    setConnections((prev) => prev.filter((c) => c.id !== connection.id));
  }

  return (
    <ul class="grid grid-cols-1 gap-1 px-2">
      <For each={connections}>
        {(connection) =>
          <li>
            <ConnectionItem {...{ connection, deleteConnection }} />
          </li>
        }
      </For>
    </ul>

  )
}
