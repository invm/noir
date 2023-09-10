import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from "solid-codemirror";
import { createSignal, onMount, Show } from "solid-js";
import {
  lineNumbers,
  EditorView,
  drawSelection,
  highlightWhitespace,
  highlightActiveLine,
} from "@codemirror/view";
import { sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { format } from "sql-formatter";
import { t } from "i18next";
import { invoke } from "@tauri-apps/api";
import { EditIcon, FireIcon } from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { QueryContentTabData } from "services/ConnectionTabs";
import { QueryResult } from "interfaces";
import { commandPaletteEmitter } from "components/CommandPalette/actions";

export const QueryTextArea = () => {
  const {
    connectionsService: {
      setActiveContentQueryTabData,
      setActiveContentQueryTabMessage,
      resetActiveContentQueryTabMessage,
      getActiveConnection,
      getActiveContentTab,
      updateStore,
    },
  } = useAppSelector();

  const updateQueryText = async (query: string) => {
    setActiveContentQueryTabData({ query });
  };

  const [code, setCode] = createSignal("");

  const onValueChange = (q: string) => {
    setCode(q);
    updateStore();
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange,
  });
  createEditorControlledValue(editorView, code);
  createExtension(() => lineNumbers());
  createExtension(() => sql());
  createExtension(() => drawSelection());
  createExtension(() => highlightWhitespace());
  createExtension(() => highlightActiveLine());
  createExtension(dracula);
  const { setFocused } = createEditorFocus(editorView);

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  const onFormat = () => {
    const formatted = format(code());
    onValueChange(formatted);
    updateQueryText(formatted);
  };

  const onExecute = async () => {
    resetActiveContentQueryTabMessage();
    const activeConnection = getActiveConnection();
    try {
      const { result } = await invoke<QueryResult>("execute_query", {
        connId: activeConnection.id,
        query: code(),
      });
      setActiveContentQueryTabData({
        query: code(),
        executed: true,
        results: result,
      });
    } catch (error) {
      setActiveContentQueryTabMessage("error", error);
    }
    updateStore();
  };

  onMount(() => {
    setCode((getActiveContentTab()?.data as QueryContentTabData).query ?? "");
  });

  const handleKeyDown = async (e: KeyboardEvent) => {
    if ((e.altKey || e.metaKey || e.ctrlKey) && e.code.startsWith("Digit")) {
      e.preventDefault();
    }
    if (e.key === "f" && e.ctrlKey) {
      onFormat();
    } else if (
      (e.metaKey || e.ctrlKey) &&
      (e.key === "Enter" || e.key === "e")
    ) {
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
      <div class="w-full p-2 bg-base-200">
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
        <div class="w-full p-2 bg-base-200">
          <span>{getActiveContentTab()?.error?.message}</span>
        </div>
      </Show>
    </div>
  );
};
