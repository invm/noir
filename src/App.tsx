import 'utils/i18n';
import 'tabulator-tables/dist/css/tabulator_midnight.min.css';
import 'solid-command-palette/pkg-dist/style.css';
import { Main } from 'components/Screens/Main';
import { CommandPaletteContext } from 'components/CommandPalette/CommandPaletteContext';
import { Loader } from 'components/UI';
import { onMount } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { listen } from '@tauri-apps/api/event';
import { Events, QueryTaskResult } from 'interfaces';
import { log } from 'utils/utils';

function App() {
  const {
    connections: { restoreConnectionStore, getConnection, updateResultSet, contentStore, loading },
    app: { restoreAppStore },
    backend: { getQueryMetadata },
    messages: { notify },
  } = useAppSelector();

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
