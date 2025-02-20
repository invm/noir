import { createStore } from 'solid-js/store';
import { Store } from 'tauri-plugin-store-api';
import { debounce } from 'utils/utils';

type OsType = 'Linux' | 'Darwin' | 'Windows_NT';
const store = new Store('.app.dat');
const INTERVAL = 2000;

const APP_KEY = '__app__';

export const GRID_THEMES = [
  'alpine',
  'alpine-dark',
  'balham',
  'balham-dark',
  'material',
  'quartz',
  'quartz-dark',
];

type AppStore = {
  vimModeOn: boolean;
  gridTheme: string;
  osType: OsType;
  enableDevTools: boolean;
  sensitiveQueries: string[];
};

const getSavedData = async (key: string) => {
  const str = await store.get(key);
  if (!str) return {} as AppStore;
  try {
    const res = JSON.parse(str as string);
    return res as AppStore;
  } catch (e) {
    return {} as AppStore;
  }
};

export const AppService = () => {
  const [appStore, setAppStore] = createStore<AppStore>({
    vimModeOn: false,
    gridTheme: 'alpine-dark',
    osType: 'Linux',
    enableDevTools: false,
    sensitiveQueries: ['Delete', 'Drop', 'Alter', 'Update', 'Truncate'],
  });

  const updateStore = debounce(async () => {
    await store.set(APP_KEY, JSON.stringify(appStore));
    await store.save();
  }, INTERVAL);

  const vimModeOn = () => appStore.vimModeOn;
  const gridTheme = () => appStore.gridTheme;

  const cmdOrCtrl = (short = false) => {
    if (appStore.osType === 'Darwin') return short ? '⌘' : 'Meta';
    return short ? '^' : 'Control';
  };

  const toggleVimModeOn = () => {
    setAppStore('vimModeOn', !appStore.vimModeOn);
    updateStore();
  };

  const updateTheme = (theme: (typeof GRID_THEMES)[number]) => {
    setAppStore('gridTheme', theme);
    updateStore();
  };

  const restoreAppStore = async () => {
    const app_store: AppStore = await getSavedData(APP_KEY);
    if (!app_store) return;
    setAppStore(() => app_store);
  };

  const updateSensitiveQueries = (options: string[]) => {
    setAppStore('sensitiveQueries', options);
    updateStore();
  };

  return {
    appStore,
    setAppStore,
    vimModeOn,
    toggleVimModeOn,
    restoreAppStore,
    screen,
    gridTheme,
    updateTheme,
    cmdOrCtrl,
    updateSensitiveQueries,
  };
};
