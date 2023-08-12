import { createStore } from "solid-js/store";

type AppStore = {
  showThemeSwitcher?: boolean;
};

export const AppService = () => {
  const [appStore, setAppStore] = createStore<AppStore>({
    showThemeSwitcher: false,
  });

  const toggleThemeSwitcher = () => {
    setAppStore("showThemeSwitcher", !appStore.showThemeSwitcher);
  };

  return {
    appStore,
    toggleThemeSwitcher,
  };
};
