import { invoke } from '@tauri-apps/api';
import { For } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { ConnectionConfig } from '../../interfaces';
import { ConnectionItem } from './ConnectionItem/ConnectionItem';

export const ConnectionsList = (props: { connections: ConnectionConfig[], setConnections: SetStoreFunction<ConnectionConfig[]> }) => {

  const deleteConnection = async (id: string) => {
    await invoke('delete_connection', { id })
    props.setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div class="p-2 pt-5 bg-gray-900">
      <h3 class="text px-2 text-xl font-bold">Saved Connections</h3>
      <div class="divider my-0"></div>
      <ul class="grid grid-cols-1 gap-1">
        <For each={props.connections}>
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
