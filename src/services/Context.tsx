import { createContext, ParentComponent, useContext } from "solid-js";
import { ErrorService } from "./Error";
import { ConnectionTabsService } from "./ConnectionTabs";
import { AppService } from "./App";

export type RootState = {
  errorService: ReturnType<typeof ErrorService>;
  connectionsService: ReturnType<typeof ConnectionTabsService>;
  appService: ReturnType<typeof AppService>;
};

const rootState: RootState = {
  errorService: ErrorService(),
  connectionsService: ConnectionTabsService(),
  appService: AppService(),
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
