import { createContext, ParentComponent, useContext } from "solid-js"
import { ErrorService } from "./Error"
import { TabsService } from "./Tabs"


export type RootState = {
  errorService: ReturnType<typeof ErrorService>
  tabsService: ReturnType<typeof TabsService>
}

const rootState: RootState = {
  errorService: ErrorService(),
  tabsService: TabsService(),
}

const StoreContext = createContext<RootState>()

export const useAppSelector = () => useContext(StoreContext)!

export const StoreProvider: ParentComponent = (props) => {
  return <StoreContext.Provider value={rootState}> {props.children} </StoreContext.Provider>
}
