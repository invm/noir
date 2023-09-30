import { createContext, ParentComponent, useContext } from "solid-js";
import { ErrorService } from "./Error";
import { ConnectionsService } from "./Connections";
import { AppService } from "./App";

export type RootState = {
  errors: ReturnType<typeof ErrorService>;
  connections: ReturnType<typeof ConnectionsService>;
  app: ReturnType<typeof AppService>;
};

const rootState: RootState = {
  errors: ErrorService(),
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
