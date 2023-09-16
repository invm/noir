import { ResultsTable } from "./ResultesTable";
import { QueryContentTabData } from "services/ConnectionTabs";
import { useAppSelector } from "services/Context";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import Split from "split.js";
import { QueryTextArea } from "./QueryTextArea";

export const QueryTab = () => {
  const {
    connectionsService: { getActiveContentTab },
  } = useAppSelector();
  const [idx, setIdx] = createSignal(0);
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
    <div class="flex flex-col h-full overflow-hidden">
      <div id="query" class="flex flex-col">
        <QueryTextArea idx={idx} setIdx={setIdx} />
      </div>
      <div id="results">
        <Show when={!getActiveContentTab().error}>
          <For
            each={
              (getActiveContentTab().data as QueryContentTabData).result_sets
            }
          >
            {(result_set, index) => (
              <Show when={index() === idx()}>
                <ResultsTable data={result_set.rows} />
              </Show>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};
