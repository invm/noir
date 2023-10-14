import { ResultsTable } from "./ResultesTable";
import { createEffect, onCleanup } from "solid-js";
import Split from "split.js";
import { QueryTextArea } from "./QueryTextArea";

export const QueryTab = () => {
  createEffect(() => {
    const q = Split(["#query", "#results"], {
      sizes: [30, 80],
      minSize: [100, 400],
      maxSize: [500, Infinity],
      direction: "vertical",
      gutterSize: 4,
    });

    onCleanup(() => {
      q.destroy();
    });
  });

  return (
    <div class="h-full max-h-full overflow-hidden">
      <div id="query" class="flex flex-col">
        <QueryTextArea />
      </div>
      <div id="results" class="">
        <ResultsTable />
      </div>
    </div>
  );
};
