import { Table } from "components/UI";
import { ContentTabData } from "services/ConnectionTabs";
import { useAppSelector } from "services/Context";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import Split from "split.js";
import { QueryTextArea } from "./QueryTextArea";

export const QueryTab = () => {
  const {
    connectionsService: { getActiveContentTab },
  } = useAppSelector();
  const [data, setData] = createSignal<Record<string, any>[]>([]);

  createEffect(() => {
    const tabledata = (getActiveContentTab().data as ContentTabData["QueryTab"])
      .results;
    if (tabledata.length) {
      setData(tabledata);
    }

    const q = Split(["#query", "#results"], {
      sizes: [40, 60],
      minSize: [100, 400],
      maxSize: [500, Infinity],
      direction: "vertical",
      gutterSize: 8,
    });

    onCleanup(() => {
      q.destroy();
    });
  });

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div id="query" class="flex">
        <QueryTextArea />
      </div>
      <div id="results">
        <Show when={data().length}>
          <Table data={data()} />
        </Show>
      </div>
    </div>
  );
};
