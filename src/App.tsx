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
import { onMount, Switch, Match } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { listen } from '@tauri-apps/api/event';
import { Events, QueryTaskResult } from 'interfaces';
import { createShortcut } from '@solid-primitives/keyboard';
import { isDev } from 'solid-js/web';

function App() {
  const {
    connections: {
      addContentTab,
      removeContentTab,
      setContentIdx,
      restoreConnectionStore,
      getConnection,
      updateResultSet,
      contentStore,
      loading,
      setLoading,
      setNextContentIdx,
      setPrevContentIdx,
      setConnectionIdx,
    },
    app: { restoreAppStore, setComponent },
    backend: { getQueryMetadata },
    messages: { notify },
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

  if (!isDev) {
    disableMenu();
  }

  createShortcut(['F1'], () => {
    setComponent((s) => (s === 1 ? 0 : 1));
  });

  createShortcut(['Meta', 't'], () => {
    addContentTab();
  });

  createShortcut(['Meta', 'w'], () => {
    removeContentTab(contentStore.idx);
  });

  createShortcut(['Control', 'Tab'], () => {
    setNextContentIdx();
  });

  createShortcut(['Control', 'Shift', 'Tab'], () => {
    setPrevContentIdx();
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Meta', String(i)], () => {
      setContentIdx(i - 1);
    });
  }

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Control', String(i)], () => {
      setConnectionIdx(i - 1);
    });
  }

  addEventListener('unhandledrejection', (e) => {
    console.log({ message: 'Unhandled rejection', info: (e.reason?.message || e.reason || e).toString() });
    notify(e.reason?.message || e, 'error');
  });

  window.addEventListener('error', (e) => {
    console.log({ message: 'Unhandled error', error: e.error });
    notify(e.message);
  });

  const compareAndAssign = async (event: QueryTaskResult) => {
    const { status, query_idx, tab_idx, conn_id } = event;
    if (getConnection().id === conn_id && contentStore.idx === tab_idx) {
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
    await listen<QueryTaskResult>(Events.QueryFinished, async (event) => {
      console.log(event);
      await compareAndAssign(event.payload);
    });
  });

  onMount(async () => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = theme;
    await restoreAppStore();
    await restoreConnectionStore();
    setLoading(false);
  });

  return (
    <Switch>
      <Match when={loading()}>
        <div class="flex justify-center items-center h-full bg-base-200 w-full">
          <Loader />
        </div>
      </Match>
      <Match when={!loading()}>
        <Main />
      </Match>
    </Switch>
  );
}

export default App;
