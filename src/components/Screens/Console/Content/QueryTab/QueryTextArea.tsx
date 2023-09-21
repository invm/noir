import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from "solid-codemirror";
import { Accessor, createSignal, For, onMount, Setter, Show } from "solid-js";
import {
  EditorView,
  drawSelection,
  highlightWhitespace,
  highlightActiveLine,
} from "@codemirror/view";
import { MySQL, sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { vim, Vim } from "@replit/codemirror-vim";
import { format } from "sql-formatter";
import { invoke } from "@tauri-apps/api";
import { EditIcon, FireIcon, VimIcon } from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { QueryContentTabData } from "services/ConnectionTabs";
import { QueryResult } from "interfaces";
import { commandPaletteEmitter } from "components/CommandPalette/actions";
import { t } from "utils/i18n";
import { Alert } from "components/UI";
import { basicSetup } from "codemirror";

export const QueryTextArea = (props: {
  idx: Accessor<number>;
  setIdx: Setter<number>;
}) => {
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
  const [vimModeOn, setVimModeOn] = createSignal(true);
  const [code, setCode] = createSignal("");

  const updateQueryText = async (query: string) => {
    setActiveContentQueryTabData({ query });
  };

  const onValueChange = (q: string) => {
    setCode(q);
    updateStore();
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange,
  });
  createEditorControlledValue(editorView, code);
  createExtension(() => drawSelection());
  createExtension(() => highlightWhitespace());
  createExtension(() => highlightActiveLine());
  createExtension(dracula);
  createExtension(() => (vimModeOn() ? vim() : []));
  createExtension(() => basicSetup);
  // TODO: add dialect and schema
  createExtension(() =>
    sql({
      dialect: MySQL,
      schema: { account: ["added_on"] },
    })
  );
  const { setFocused } = createEditorFocus(editorView);
  // TODO: add option to scroll inside autocompletion list with c-l and c-k
  // defaultKeymap.push({ keys: "gq", type: "operator", operator: "hardWrap" });
  // Vim.defineOperator(
  //   "hardWrap",
  //   function(cm, operatorArgs, ranges, oldAnchor, newHead) {
  //     console.log('hardwrap')
  //   }
  // );

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

  const onFormat = () => {
    const formatted = format(code());
    onValueChange(formatted);
    updateQueryText(formatted);
  };

  const getSelection = () => {
    return editorView().state.sliceDoc(
      editorView().state.selection.ranges[0].from,
      editorView().state.selection.ranges[0].to
    );
  };

  const onExecute = async () => {
    const selectedText = getSelection();
    resetActiveContentQueryTabMessage();
    const activeConnection = getActiveConnection();
    try {
      const { result_sets } = await invoke<QueryResult>("execute_query", {
        connId: activeConnection.id,
        query: selectedText || code(),
      });
      setActiveContentQueryTabData({
        query: code(),
        executed: true,
        result_sets,
      });
      // console.log({ result_sets });
    } catch (error) {
      // console.log({ error });
      setActiveContentQueryTabMessage(String(error));
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
    commandPaletteEmitter.on("next-result-set", onNextClick);
    commandPaletteEmitter.on("prev-result-set", onPrevClick);
    commandPaletteEmitter.on("execute", async () => {
      await onExecute();
    });
  });

  const onPrevClick = () => {
    props.setIdx(
      (props.idx() -
        1 +
        (getActiveContentTab().data as QueryContentTabData).result_sets
          .length) %
      (getActiveContentTab().data as QueryContentTabData).result_sets.length
    );
  };

  const onNextClick = () => {
    props.setIdx(
      (props.idx() + 1) %
      (getActiveContentTab().data as QueryContentTabData).result_sets.length
    );
  };

  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full px-2 py-1 bg-base-100 border-b-2 border-accent flex items-center">
        <div class="flex items-center">
          <div
            class="tooltip tooltip-primary tooltip-bottom"
            data-tip={t("components.console.actions.format")}
          >
            <button
              class="btn btn-ghost btn-xs mr-2"
              onClick={() => onFormat()}
            >
              <EditIcon />
            </button>
          </div>
          <div
            class="tooltip tooltip-primary tooltip-bottom"
            data-tip={t("components.console.actions.execute")}
          >
            <button
              class="btn btn-ghost btn-xs mr-2"
              onClick={() => onExecute()}
            >
              <FireIcon />
            </button>
          </div>

          <div
            class="tooltip tooltip-primary tooltip-bottom"
            data-tip={t("components.console.actions.vim_mode_on")}
          >
            <div class="flex items-center mr-2">
              <span class="mr-2">
                <VimIcon />
              </span>
              <input
                type="checkbox"
                class="toggle"
                classList={{
                  "toggle-success": vimModeOn(),
                }}
                checked={vimModeOn()}
                onChange={() => setVimModeOn((v) => !v)}
              />
            </div>
          </div>
        </div>

        <Show when={getActiveContentTab().error}>
          <Alert color="error">{getActiveContentTab().error}</Alert>
        </Show>
        <Show when={!getActiveContentTab().error}>
          <For
            each={
              (getActiveContentTab().data as QueryContentTabData).result_sets
            }
          >
            {(result_set, index) => (
              <Show when={index() === props.idx()}>
                <Alert color="info">
                  <span class="font-semibold">
                    {t("components.console.result_set")}
                    <button
                      class="btn btn-xs mx-0.5 btn-neutral h-5 min-h-0"
                      onClick={onPrevClick}
                    >
                      {"<"}
                    </button>
                    {"#" + (props.idx() + 1)}
                    <button
                      class="btn btn-xs mx-0.5 btn-neutral h-5 min-h-0"
                      onClick={onNextClick}
                    >
                      {">"}
                    </button>
                    {t("components.console.out_of") +
                      (getActiveContentTab().data as QueryContentTabData)
                        .result_sets.length +
                      ". "}
                  </span>
                  <span class="font-semibold">{result_set.info + ""}</span>
                </Alert>
              </Show>
            )}
          </For>
        </Show>
      </div>
      <div class="overflow-hidden w-full h-full" onKeyDown={handleKeyDown}>
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  );
};
