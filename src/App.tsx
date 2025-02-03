import 'utils/i18n';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import 'tippy.js/dist/tippy.css';
import './index.css';
import { Main } from 'components/Screens/Main';
import { Loader } from 'components/UI';
import { onMount, Switch, Match, createSignal, Show } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { listen } from '@tauri-apps/api/event';
import { Events, QueryTaskResult } from 'interfaces';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';
import { t } from 'utils/i18n';
import { isDev } from 'solid-js/web';
import { error } from 'tauri-plugin-log-api';

function App() {
  const {
    connections: {
      store,
      restoreConnectionStore,
      getConnection,
      updateResultSet,
      loading,
      setLoading,
    },
    app: { restoreAppStore, setScreen, appStore },
    backend: { getQueryMetadata },
    messages: { notify },
  } = useAppSelector();

  const [updating, setUpdating] = createSignal(false);
  const [shouldUpdate, setShouldUpdate] = createSignal(false);
  const [updateManifest, setUpdateManifest] = createSignal({
    version: '',
    date: '',
    body: '',
  });

  const checkForUpdates = async () => {
    const { shouldUpdate, manifest } = await checkUpdate().catch((e) => {
      console.error(e);
      return { shouldUpdate: false, manifest: null };
    });
    if (shouldUpdate) {
      setShouldUpdate(true);
      setUpdateManifest(() => ({
        version: manifest!.version,
        date: manifest!.date,
        body: manifest!.body,
      }));
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await installUpdate();
      await relaunch();
    } catch (error) {
      notify(error);
    } finally {
      setUpdating(false);
      setShouldUpdate(false);
    }
  };

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

  if (!appStore.enableDevTools && !isDev) {
    disableMenu();
  }

  addEventListener('unhandledrejection', (e) => {
    error(
      JSON.stringify({
        message: 'Unhandled rejection',
        info: (e.reason?.message || e.reason || e).toString(),
        error: e,
      })
    );
    notify(e.reason?.message || e, 'error');
  });

  window.addEventListener('error', (e) => {
    if (
      e?.message ===
      'ResizeObserver loop completed with undelivered notifications.'
    )
      return;
    error(JSON.stringify({ message: 'Unhandled error', error: e.error }));
    notify(e.message);
  });

  const compareAndAssign = async (event: QueryTaskResult) => {
    const { status, query_idx, tab_idx, conn_id } = event;
    if (getConnection().id === conn_id && getConnection().idx === tab_idx) {
      if (status === 'Completed') {
        const md = await getQueryMetadata(event.path);
        const metadata = { ...md, path: event.path, status };
        updateResultSet(tab_idx, query_idx, metadata);
      } else if (status === 'Error') {
        updateResultSet(tab_idx, query_idx, { status, error: event.error });
        notify(event.error, 'error');
      }
    }
  };

  onMount(async () => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = theme;
    await restoreAppStore();
    await restoreConnectionStore();
    if (store.tabs.length === 0) {
      setScreen('home');
    }
    setLoading(false);

    await listen<QueryTaskResult>(Events.QueryFinished, async (event) => {
      await compareAndAssign(event.payload);
    });
    await checkForUpdates();
  });

  return (
    <>
      <Switch>
        <Match when={loading()}>
          <div class="flex justify-center flex-col gap-4 items-center h-full bg-base-200 w-full">
            <Loader />
            <div class="text-lg">{t('connecting')}</div>
          </div>
        </Match>
        <Match when={!loading()}>
          <Main />
        </Match>
      </Switch>
      <Show when={shouldUpdate()}>
        <div class="toast z-50 whitespace-normal">
          <div class="bg-base-300 rounded-lg w-[500px]">
            <div class="flex flex-col items-start p-4">
              <div class="flex items-center w-full">
                <div class="text-base-content font-bold text-lg">
                  {t('update_toast.title')}: {updateManifest().version}
                </div>
                <button
                  class="ml-auto fill-current text-gray-700 w-6 h-6 cursor-pointer"
                  onClick={() => {
                    setShouldUpdate(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z" />
                  </svg>
                </button>
              </div>
              <div class="divider my-0.5"></div>
              <span class="">{t('update_toast.release_notes')}</span>
              <div>{updateManifest().body}</div>
              <hr class="py-2" />
              <div class="ml-auto">
                <button
                  disabled={updating()}
                  onClick={handleUpdate}
                  class="btn btn-primary btn-sm"
                >
                  {t('update_toast.download')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}

export default App;
