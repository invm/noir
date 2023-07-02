import { AddConnectionForm } from '../components/AddConnectionForm';
import { ConnectionsList } from '../components/ConnectionsList/ConnectionsList';
import { invoke } from '@tauri-apps/api';
import { ConnectionConfig, Scheme } from '../interfaces';
import { createStore } from 'solid-js/store';
import { onMount } from 'solid-js';

const Home = () => {
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

export default Home
