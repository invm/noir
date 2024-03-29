import { editorThemes } from 'components/Screens/Console/Content/QueryTab/components/EditorThemes';
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Store } from 'tauri-plugin-store-api';
import { debounce } from 'utils/utils';

type OsType = 'Linux' | 'Darwin' | 'Windows_NT';
const store = new Store('.app.dat');
const INTERVAL = 2000;

const APP_KEY = '__app__';

export const THEMES = {
  ui: ['retro', 'forest', 'autumn', 'garden', 'business', 'synthwave', 'dracula', 'dark', 'night', 'cupcake'],
  editor: Object.keys(editorThemes) as EditorTheme[],
  grid: ['alpine', 'alpine-dark', 'balham', 'balham-dark', 'material', 'quartz', 'quartz-dark'],
} as const;

export type EditorTheme = keyof typeof editorThemes;
export type ThemeCategory = keyof typeof THEMES;

type AppStore = {
  vimModeOn: boolean;
  gridTheme: string;
  editorTheme: EditorTheme;
  osType: OsType;
  enableDevTools: boolean;
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

type Screen = 'console' | 'settings' | 'keymaps' | 'home';

export const AppService = () => {
  const [appStore, setAppStore] = createStore<AppStore>({
    vimModeOn: false,
    gridTheme: 'alpine-dark',
    editorTheme: 'Dracula',
    osType: 'Linux',
    enableDevTools: false,
  });

  const [screen, setScreen] = createSignal<Screen>('console');
  const [lastScreen, setLastScreen] = createSignal<Screen>('console');

  const updateStore = debounce(async () => {
    await store.set(APP_KEY, JSON.stringify(appStore));
    await store.save();
  }, INTERVAL);

  const vimModeOn = () => appStore.vimModeOn;
  const gridTheme = () => appStore.gridTheme;
  const editorTheme = () => appStore.editorTheme;

  const toggleScreen = (s: Screen) => {
    if (screen() === s) {
      const last = lastScreen();
      setLastScreen(screen());
      setScreen(last);
      return;
    }
    setLastScreen(screen());
    setScreen(s);
  };

  const altOrMeta = (short = false) => {
    if (appStore.osType === 'Darwin') return short ? 'Cmd' : 'Meta';
    return 'Alt';
  };
  const cmdOrCtrl = (short = false) => {
    if (appStore.osType === 'Darwin') return short ? 'Cmd' : 'Meta';
    return short ? 'Ctrl' : 'Control';
  };

  const toggleVimModeOn = () => {
    setAppStore('vimModeOn', !appStore.vimModeOn);
    updateStore();
  };

  const updateTheme = <T extends ThemeCategory>(t: T, theme: (typeof THEMES)[T][number]) => {
    if (t === 'ui') {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
    } else if (t === 'editor') {
      setAppStore('editorTheme', theme as EditorTheme);
    } else if (t === 'grid') {
      setAppStore('gridTheme', theme);
    }
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
    screen,
    setScreen,
    toggleScreen,
    gridTheme,
    editorTheme,
    updateTheme,
    cmdOrCtrl,
    altOrMeta,
  };
};
