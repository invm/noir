import { ResultsTable } from "./ResultesTable";
import { QueryContentTabData } from "services/ConnectionTabs";
import { useAppSelector } from "services/Context";
import { createEffect, Match, onCleanup, Switch } from "solid-js";
import Split from "split.js";
import { QueryTextArea } from "./QueryTextArea";
import { t } from "i18next";

export const QueryTab = () => {
  const {
    connectionsService: { getActiveContentTab },
  } = useAppSelector();
  createEffect(() => {
    const q = Split(["#query", "#results"], {
      sizes: [40, 60],
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
      <div id="query" class="flex">
        <QueryTextArea />
      </div>
      <div id="results">
        <Switch>
          <Match
            when={
              (getActiveContentTab().data as QueryContentTabData).executed &&
              (getActiveContentTab().data as QueryContentTabData).result_sets
                .length > 0
            }
          >
            <ResultsTable
              data={(getActiveContentTab().data as QueryContentTabData).result_sets}
            />
          </Match>
          <Match
            when={
              (getActiveContentTab().data as QueryContentTabData).executed &&
              (getActiveContentTab().data as QueryContentTabData).result_sets
                .length === 0
            }
          >
            <div class="flex justify-center align-center">
              {t("components.console.zero_results")}
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};
