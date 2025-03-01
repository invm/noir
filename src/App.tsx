import 'utils/i18n';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import './index.css';
import { onMount } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { listen } from '@tauri-apps/api/event';
import { Events, QueryTaskResult } from 'interfaces';
import { error } from '@tauri-apps/plugin-log';
import { Router } from 'Router';
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from '@kobalte/core';
import { restoreTheme } from 'pages/settings/themes/ui';
import { toast } from 'solid-sonner';
import { CommandPaletteProviderComponent } from 'services/palette/provider';
import { checkForUpdates } from 'utils/utils';
import { isDev } from 'solid-js/web';

function App() {
  const {
    connections: {
      restoreConnectionStore,
      getConnection,
      updateResultSet,
      setLoading,
    },
    app: { restoreAppStore },
    backend: { getQueryMetadata },
  } = useAppSelector();

  const disableMenu = () => {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    document.addEventListener(
      'selectstart',
      (e) => {
        e.preventDefault();
        return false;
      },
      { capture: true }
    );
  };

  addEventListener('unhandledrejection', (e) => {
    error(
      JSON.stringify({
        message: 'Unhandled rejection',
        info: (e.reason?.message || e.reason || e).toString(),
        error: e,
      })
    );
    toast.error('Error occured', { description: e.reason?.message || e });
  });

  window.addEventListener('error', (e) => {
    if (
      ['ResizeObserver loop', '.focus'].some((elem) =>
        e?.message.includes(elem)
      )
    ) {
      return;
    }
    error(JSON.stringify({ message: 'Unhandled error', error: e.error }));
    toast.error('Error', { description: e.message });
  });

  const compareAndAssign = async (event: QueryTaskResult) => {
    const { status, query_idx, tab_idx, conn_id } = event;
    if (getConnection().id === conn_id) {
      if (status === 'Completed') {
        const md = await getQueryMetadata(event.path);
        const metadata = { ...md, path: event.path, status };
        updateResultSet(tab_idx, query_idx, metadata);
      } else if (status === 'Error') {
        updateResultSet(tab_idx, query_idx, { status, error: event.error });
        toast.error('Error in query', { description: event.error });
      }
    }
  };

  onMount(async () => {
    if (!isDev) {
      disableMenu();
    }
    restoreTheme();
    await restoreAppStore();
    await restoreConnectionStore();
    setLoading(false);

    await listen<QueryTaskResult>(Events.QueryFinished, async (event) => {
      await compareAndAssign(event.payload);
    });
    await checkForUpdates();
  });

  const storageManager = createLocalStorageManager('ui-theme');

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider
        initialColorMode="dark"
        storageManager={storageManager}
      >
        <CommandPaletteProviderComponent>
          <Router />
        </CommandPaletteProviderComponent>
      </ColorModeProvider>
    </>
  );
}

export default App;
