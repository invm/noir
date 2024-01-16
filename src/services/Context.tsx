import { createContext, createSignal, onMount, ParentComponent, Show, useContext } from 'solid-js';
import { OsType, type } from '@tauri-apps/api/os';
import { MessageService } from './Messages';
import { ConnectionsService } from './Connections';
import { AppService } from './App';
import { BackendService } from './Backend';
import { RegisterKeymaps } from './RegisterKeymaps';

export type RootState = {
  messages: ReturnType<typeof MessageService>;
  connections: ReturnType<typeof ConnectionsService>;
  app: ReturnType<typeof AppService>;
  backend: ReturnType<typeof BackendService>;
};

const rootState: RootState = {
  messages: MessageService(),
  connections: ConnectionsService(),
  app: AppService(),
  backend: BackendService(),
};

const StoreContext = createContext<RootState>();

export const useAppSelector = () => useContext(StoreContext)!;
export const StoreProvider: ParentComponent = (props) => {
  const [loaded, setLoaded] = createSignal(false);
  const [osType, setOsType] = createSignal<OsType>('Linux');

  onMount(async () => {
    const osType = await type();
    setOsType(osType);
    setLoaded(true);
  });

  return (
    <StoreContext.Provider value={rootState}>
      <Show when={loaded()}>
        <RegisterKeymaps osType={osType()}>{props.children}</RegisterKeymaps>
      </Show>
    </StoreContext.Provider>
  );
};
