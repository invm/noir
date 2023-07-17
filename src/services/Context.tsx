import { createContext, ParentComponent, useContext } from "solid-js"
import { ErrorService } from "./Error"
import { ConnectionTabsService } from "./ConnectionTabs"


export type RootState = {
  errorService: ReturnType<typeof ErrorService>
  connectionsService: ReturnType<typeof ConnectionTabsService>
}

const rootState: RootState = {
  errorService: ErrorService(),
  connectionsService: ConnectionTabsService(),
}

const StoreContext = createContext<RootState>()

export const useAppSelector = () => useContext(StoreContext)!

export const StoreProvider: ParentComponent = (props) => {
  return <StoreContext.Provider value={rootState}> {props.children} </StoreContext.Provider>
}
