import { createContext, ParentComponent, useContext } from 'solid-js';
import { type } from '@tauri-apps/plugin-os';
import { ConnectionsService } from './Connections';
import { AppService } from './App';
import { BackendService } from './Backend';
import { RegisterKeymaps } from './RegisterKeymaps';

export type RootState = {
  connections: ReturnType<typeof ConnectionsService>;
  app: ReturnType<typeof AppService>;
  backend: ReturnType<typeof BackendService>;
};

const rootState: RootState = {
  connections: ConnectionsService(),
  app: AppService(),
  backend: BackendService(),
};

const StoreContext = createContext<RootState>();

export const useAppSelector = () => useContext(StoreContext)!;

export const StoreProvider: ParentComponent = (props) => {
  return (
    <StoreContext.Provider value={rootState}>
      <RegisterKeymaps osType={type()}>{props.children}</RegisterKeymaps>
    </StoreContext.Provider>
  );
};
