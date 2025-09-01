import { createStore } from 'solid-js/store';
import { LazyStore } from '@tauri-apps/plugin-store';
import { debounce } from 'utils/utils';
import { OsType } from '@tauri-apps/plugin-os';

const store = new LazyStore('.app.dat');
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
  gridTheme: string;
  osType: OsType;
  sensitiveQueries: string[];
  vimModeOn: boolean;
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
    gridTheme: 'alpine-dark',
    osType: 'linux',
    sensitiveQueries: ['Delete', 'Drop', 'Alter', 'Update', 'Truncate'],
    vimModeOn: false,
  });

  const updateStore = debounce(async () => {
    await store.set(APP_KEY, JSON.stringify(appStore));
    await store.save();
  }, INTERVAL);

  const gridTheme = () => appStore.gridTheme;

  const cmdOrCtrl = (short = false) => {
    if (appStore.osType === 'macos') return short ? '⌘' : 'Meta';
    return short ? '^' : 'Control';
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

  const setVimMode = (enabled: boolean) => {
    setAppStore('vimModeOn', enabled);
    updateStore();
  };

  return {
    appStore,
    setAppStore,
    restoreAppStore,
    screen,
    gridTheme,
    updateTheme,
    cmdOrCtrl,
    updateSensitiveQueries,
    setVimMode,
  };
};
