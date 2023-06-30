import { invoke } from '@tauri-apps/api';
import { onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button, Card } from './UI';

export const ConnectionsList = () => {
  const [connections, setConnections] = createStore([]);

  const getConnections = () => {
    return invoke('get_connections')
  };

  onMount(async () => {
    console.log('mounted');
    const res = await getConnections();
    console.log(res)
    setConnections(res as any);
  });

  return (
    <div class="flex-2 p-3">
      <div class="grid grid-cols-3 xl:grid-cols-4 gap-4 ">
        <For each={connections()}>
          {(conn) =>
            <Card style={{ borderColor: conn.color }}>
              <h5 class="text text-2xl font-bold">{conn.name}</h5>
              <div>
                <p class="text my-0 ">{conn.address}</p>
                <p class="text ">{conn.default_db}</p>
              </div>
              <Button class="bg-sky-600 hover:bg-sky-800 dark:bg-lime-600 dark:hover:bg-lime-700" >Click me</Button>
            </Card>
          }
        </For>
      </div>
    </div>
  )
}
