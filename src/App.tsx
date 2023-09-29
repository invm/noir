import "utils/i18n";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import "solid-command-palette/pkg-dist/style.css";
import { Main } from "components/Screens/Main";
import { CommandPaletteContext } from "components/CommandPalette/CommandPaletteContext";
import { Loader } from "components/UI";
import { createEffect, createSignal, onMount } from "solid-js";
import { useAppSelector } from "services/Context";

function App() {
  const [loading, setLoading] = createSignal(true);
  const {
    connectionsService: { restoreConnectionStore },
  } = useAppSelector();

  createEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  });

  onMount(async () => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.dataset.theme = theme;
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
