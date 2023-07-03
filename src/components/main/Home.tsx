import { invoke } from '@tauri-apps/api';
import { createStore } from 'solid-js/store';
import { onMount } from 'solid-js';
import { ConnectionConfig, Scheme } from '../../interfaces';
import { ConnectionsList } from '../Connections/ConnectionsList/ConnectionsList';
import { AddConnectionForm } from '../Connections/AddConnectionForm';

export const Home = () => {
  const addConnection = async (conn: { name: string, scheme: Scheme, color: string }) => {
    await invoke('add_connection', conn)
    const res = await invoke('get_connections', {})
    setConnections(res as ConnectionConfig[]);
  }

  const [connections, setConnections] = createStore<ConnectionConfig[]>([]);

  onMount(async () => {
    const res = await invoke('get_connections', {})
    setConnections(res as ConnectionConfig[]);
  });

  return (
    <div class="grid grid-cols-2 h-full">
      <ConnectionsList {...{ connections, setConnections }} />
      <AddConnectionForm {...{ addConnection }} />
    </div>
  )
}

