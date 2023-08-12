import "utils/i18n";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import "solid-command-palette/pkg-dist/style.css";
import { Main } from "components/Screens/Main";
import { CommandPaletteContext } from "components/CommandPalette/CommandPaletteContext";

function App() {
  return (
    <CommandPaletteContext>
      <Main />
    </CommandPaletteContext>
  );
}

export default App;
