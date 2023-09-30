import { ResultsTable } from "./ResultesTable";
import { useAppSelector } from "services/Context";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import Split from "split.js";
import { QueryTextArea } from "./QueryTextArea";
import { createStore } from "solid-js/store";
import { Row } from "interfaces";
import { createShortcut } from "@solid-primitives/keyboard";

export const QueryTab = () => {
  const {
    connectionsService: { getContent },
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

  const {
    connectionsService: { getContentData },
  } = useAppSelector();
  const [rows, setRows] = createStore<Row[]>([]);

  createEffect(() => {
    setRows(getContentData("Query").result_sets[idx()]?.rows || []);
  });

  const onPrevClick = () => {
    setIdx(
      (idx() - 1 + getContentData("Query").result_sets.length) %
      getContentData("Query").result_sets.length
    );
  };

  const onNextClick = () => {
    setIdx((idx() + 1) % getContentData("Query").result_sets.length);
  };

  createShortcut(["Control", "Shift", "N"], onNextClick);
  createShortcut(["Control", "Shift", "P"], onPrevClick);

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div id="query" class="flex flex-col">
        <QueryTextArea
          idx={idx}
          onPrevClick={onPrevClick}
          onNextClick={onNextClick}
        />
      </div>
      <div id="results">
        <Show when={!getContent().error}>
          <ResultsTable rows={rows} />
        </Show>
      </div>
    </div>
  );
};
