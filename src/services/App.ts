import { createStore } from "solid-js/store";
import { Store } from "tauri-plugin-store-api";
import { debounce } from "utils/utils";

const store = new Store(".app.dat");
const INTERVAL = 2000;

const APP_KEY = "__app__";

type AppStore = {
  vimModeOn?: boolean;
};

const getSavedData = async (key: string, defaultValue: any = []) => {
  const str = await store.get(key);
  if (!str) return defaultValue;
  try {
    const res = JSON.parse(str as string);
    return res as unknown;
  } catch (e) {
    return defaultValue;
  }
};

export const AppService = () => {
  const [appStore, setAppStore] = createStore<AppStore>({
    vimModeOn: true,
  });

  const updateStore = debounce(async () => {
    await store.set(APP_KEY, JSON.stringify(appStore));
    await store.save();
  }, INTERVAL);

  const vimModeOn = () => appStore.vimModeOn;

  const toggleVimModeOn = () => {
    setAppStore("vimModeOn", !appStore.vimModeOn);
    updateStore();
  };

  const restoreAppStore = async () => {
    const app_store: AppStore = await getSavedData(APP_KEY);
    if (!app_store) return;
    setAppStore(() => app_store);
  };

  return {
    appStore,
    setAppStore,
    vimModeOn,
    toggleVimModeOn,
    restoreAppStore,
  };
};
