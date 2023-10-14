import 'utils/i18n';
import 'tabulator-tables/dist/css/tabulator_midnight.min.css';
import 'solid-command-palette/pkg-dist/style.css';
import { Main } from 'components/Screens/Main';
import { CommandPaletteContext } from 'components/CommandPalette/CommandPaletteContext';
import { Loader } from 'components/UI';
import { createEffect, createSignal, onMount } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { listen } from '@tauri-apps/api/event';
import { Events, QueryTaskResult } from 'interfaces';
import { log } from 'utils/utils';

function App() {
  const [loading, setLoading] = createSignal(true);
  const {
    connections: {
      restoreConnectionStore,
      getConnection,
      updateResultSet,
      contentStore: { idx },
      queryIdx,
    },
    app: { restoreAppStore },
    backend: { getQueryMetadata },
  } = useAppSelector();

  createEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  });

  const compareAndAssign = async (event: QueryTaskResult) => {
    if (
      getConnection().id === event.conn_id &&
      idx === event.tab_idx &&
      queryIdx() === event.query_idx
    ) {
      if (event.status === 'Completed') {
        const md = await getQueryMetadata(event.path);
        const metadata = {
          ...md,
          path: event.path,
          status: event.status,
        };
        updateResultSet(event.tab_idx, event.query_idx, metadata);
      } else if (event.status === 'Error') {
        updateResultSet(event.tab_idx, event.query_idx, {
          status: event.status,
          info: event.error,
        });
      }
    }
    // setContentStore('tabs', idx ?? contentStore.idx, key, data);
  };

  onMount(async () => {
    await listen<QueryTaskResult>(Events.QueryFinished, async (event) => {
      log(event);
      await compareAndAssign(event.payload);
    });
  });

  onMount(async () => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = theme;
    await restoreAppStore();
    await restoreConnectionStore();
  });

  return (
    <CommandPaletteContext>
      {loading() ? (
        <div class="flex justify-center items-center h-full bg-base-200 w-full">
          <Loader />
        </div>
      ) : (
        <Main />
      )}
    </CommandPaletteContext>
  );
}

export default App;
