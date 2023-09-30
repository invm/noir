import { createStore } from "solid-js/store";

type AppStore = {};

export const AppService = () => {
  const [appStore, setAppStore] = createStore<AppStore>({});

  return {
    appStore,
    setAppStore,
  };
};
