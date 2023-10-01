import { createContext, ParentComponent, useContext } from "solid-js";
import { MessageService } from "./Messages";
import { ConnectionsService } from "./Connections";
import { AppService } from "./App";

export type RootState = {
  messages: ReturnType<typeof MessageService>;
  connections: ReturnType<typeof ConnectionsService>;
  app: ReturnType<typeof AppService>;
};

const rootState: RootState = {
  messages: MessageService(),
  connections: ConnectionsService(),
  app: AppService(),
};

const StoreContext = createContext<RootState>();

export const useAppSelector = () => useContext(StoreContext)!;

export const StoreProvider: ParentComponent = (props) => {
  return (
    <StoreContext.Provider value={rootState}>
      {props.children}
    </StoreContext.Provider>
  );
};
