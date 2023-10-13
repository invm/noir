import "utils/i18n";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import "solid-command-palette/pkg-dist/style.css";
import { Main } from "components/Screens/Main";
import { CommandPaletteContext } from "components/CommandPalette/CommandPaletteContext";
import { Loader } from "components/UI";
import { createEffect, createSignal, onMount } from "solid-js";
import { useAppSelector } from "services/Context";
import { listen } from "@tauri-apps/api/event";
import { Events, QueryTaskResult } from "interfaces";
import { log } from "utils/utils";

function App() {
  const [loading, setLoading] = createSignal(true);
  const {
    connections: {
      restoreConnectionStore,
      getConnection,
      contentStore: { idx },
      queryIdx,
    },
    app: { restoreAppStore },
  } = useAppSelector();

  createEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  });

  const getQueryResults = () => { };

  const compareAndAssign = (event: QueryTaskResult) => {
    if (
      getConnection().id === event.conn_id &&
      idx === event.tab_idx &&
      queryIdx() === event.query_idx
    ) {
      // TODO: should get 0 page of results
    }
  };

  onMount(async () => {
    await listen<QueryTaskResult>(Events.QueryFinished, (event) => {
      log(event);
      compareAndAssign(event.payload);
    });
  });

  onMount(async () => {
    const theme = localStorage.getItem("theme") || "dark";
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
