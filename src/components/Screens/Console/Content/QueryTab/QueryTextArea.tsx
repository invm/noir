import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from "solid-codemirror";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { lineNumbers, EditorView } from "@codemirror/view";
import { sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { format } from "sql-formatter";
import { t } from "i18next";
import { invoke } from "@tauri-apps/api";
import { EditIcon, FireIcon } from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { ContentComponent, QueryContentTabData } from "services/ConnectionTabs";
import { QueryResult } from "interfaces";
import { commandPaletteEmitter } from "components/CommandPalette/actions";

export const QueryTextArea = () => {
  const {
    connectionsService: {
      setActiveContentQueryTabData,
      setActiveContentQueryTabMessage,
      resetActiveContentQueryTabMessage,
      contentStore,
      setContentStore,
      getActiveConnection,
      getActiveContentTab,
      updateStore,
    },
  } = useAppSelector();

  const updateQueryText = async (query: string) => {
    setContentStore(
      "tabs",
      contentStore.tabs.map((t, idx) =>
        idx === contentStore.idx
          ? {
            ...t,
            data: {
              query,
              results: (t.data as QueryContentTabData).results ?? [],
            },
            key: ContentComponent.QueryTab,
          }
          : t
      )
    );
  };

  const onInput = (q: string) => {
    updateQueryText(q);
    setCode(q);
    updateStore();
  };

  const [code, setCode] = createSignal("");
  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: onInput,
  });
  createEditorControlledValue(editorView, code);
  createExtension(() => lineNumbers());
  createExtension(() => sql());
  createExtension(dracula);
  const { setFocused } = createEditorFocus(editorView);

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  const onFormat = () => {
    const formatted = format(code());
    onInput(formatted);
  };

  const onExecute = async () => {
    resetActiveContentQueryTabMessage();
    const activeConnection = getActiveConnection();
    try {
      const { result } = await invoke<QueryResult>("execute_query", {
        connId: activeConnection.id,
        query: code(),
      });
      setActiveContentQueryTabData({ query: code(), results: result });
    } catch (error) {
      setActiveContentQueryTabMessage("error", error);
    }
  };

  createEffect(() => {
    setCode((getActiveContentTab()?.data as QueryContentTabData).query ?? "");
  });

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === "f" && e.ctrlKey) {
      onFormat();
    } else if (e.key === "e" && e.ctrlKey) {
      await onExecute();
    }
  };

  onMount(() => {
    commandPaletteEmitter.on("focus-query-text-area", () => {
      // this is done with a timeout because when this event is emitted the active element is the command palette
      // and imeediately focusing the query text area doesn't work
      setTimeout(() => {
        // @ts-ignore
        document.activeElement?.blur();
        setFocused(true);
      }, 1);
    });
  });

  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full p-2 bg-base-100">
        <div
          class="tooltip tooltip-primary tooltip-bottom"
          data-tip={t("components.console.actions.format")}
        >
          <button class="btn btn-ghost btn-xs mr-2" onClick={() => onFormat()}>
            <EditIcon />
          </button>
        </div>
        <div
          class="tooltip tooltip-primary tooltip-bottom"
          data-tip={t("components.console.actions.execute")}
        >
          <button class="btn btn-ghost btn-xs mr-2" onClick={() => onExecute()}>
            <FireIcon />
          </button>
        </div>
      </div>
      <div class="overflow-hidden w-full h-full" onKeyDown={handleKeyDown}>
        <div ref={ref} class="w-full h-full" />
      </div>
      <Show when={getActiveContentTab()?.error}>
        <div class="w-full p-2 bg-base-100">
          <span>{getActiveContentTab()?.error?.message}</span>
        </div>
      </Show>
    </div>
  );
};
