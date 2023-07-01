import { createContext, ParentComponent, useContext } from "solid-js"
import { ErrorService } from "./Error"


export type RootState = {
  errorService: ReturnType<typeof ErrorService>
}


const rootState: RootState = {
  errorService: ErrorService()
}

const StoreContext = createContext<RootState>()

export const useAppSelector = () => useContext(StoreContext)!

export const StoreProvider: ParentComponent = (props) => {
  return <StoreContext.Provider value={rootState}> {props.children} </StoreContext.Provider>
}
