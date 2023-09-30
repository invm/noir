import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from "solid-codemirror";
import { Accessor, createEffect, createSignal, For, Show } from "solid-js";
import {
  EditorView,
  drawSelection,
  highlightWhitespace,
  highlightActiveLine,
} from "@codemirror/view";
import { MySQL, sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { vim } from "@replit/codemirror-vim";
import { format } from "sql-formatter";
import { invoke } from "@tauri-apps/api";
import {
  ChevronLeft,
  ChevronRight,
  EditIcon,
  FireIcon,
  VimIcon,
} from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { QueryResult } from "interfaces";
import { t } from "utils/i18n";
import { Alert } from "components/UI";
import { basicSetup } from "codemirror";
import { createShortcut } from "@solid-primitives/keyboard";

export const QueryTextArea = (props: {
  idx: Accessor<number>;
  onPrevClick: () => void;
  onNextClick: () => void;
}) => {
  const {
    connectionsService: {
      updateContentTab,
      getConnection,
      getContent,
      getContentData,
    },
  } = useAppSelector();
  const [vimModeOn, setVimModeOn] = createSignal(true);
  const [code, setCode] = createSignal("");

  const updateQueryText = async (query: string) => {
    updateContentTab("data", { query });
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
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
    setCode(formatted);
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
    updateContentTab("error", undefined);
    const activeConnection = getConnection();
    try {
      const { result_sets } = await invoke<QueryResult>("execute_query", {
        connId: activeConnection.id,
        query: selectedText || code(),
      });
      updateContentTab("data", { query: code(), executed: true, result_sets });
      // console.log({ result_sets });
    } catch (error) {
      updateContentTab("error", String(error));
    }
  };

  createEffect(() => {
    setCode(getContentData("Query").query ?? "");
  });

  createShortcut(["Control", "e"], onExecute);
  createShortcut(["Control", "l"], () => setFocused(true));
  createShortcut(["Control", "Shift", "F"], onFormat);

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

        <Show when={getContent().error}>
          <Alert color="error">{getContent().error}</Alert>
        </Show>
        <Show when={!getContent().error}>
          <For each={getContentData("Query").result_sets}>
            {(result_set, index) => (
              <Show when={index() === props.idx()}>
                <Alert color="info">
                  <span class="font-semibold">
                    {t("components.console.result_set")}
                    <button
                      class="btn btn-xs mx-0.5 btn-neutral h-5 min-h-0"
                      onClick={props.onPrevClick}
                    >
                      <ChevronLeft />
                    </button>
                    {"#" + (props.idx() + 1)}
                    <button
                      class="btn btn-xs mx-0.5 btn-neutral h-5 min-h-0"
                      onClick={props.onNextClick}
                    >
                      <ChevronRight />
                    </button>
                    {t("components.console.out_of") +
                      getContentData("Query").result_sets.length +
                      ". "}
                  </span>
                  <span class="font-semibold">{result_set.info + ""}</span>
                </Alert>
              </Show>
            )}
          </For>
        </Show>
      </div>
      <div class="overflow-hidden w-full h-full">
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  );
};
