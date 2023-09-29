import { actions, commandPaletteEmitter } from "./actions";
import { useAppSelector } from "services/Context";
import { CommandPalette, Root } from "solid-command-palette";
import { JSX } from "solid-js/jsx-runtime";
import { onMount } from "solid-js";

export interface ActionsContext {
  showThemeSwitcher: () => void;
  [key: string]: any;
}

export const CommandPaletteContext = (props: { children: JSX.Element }) => {
  const {
    appService: { toggleThemeSwitcher, appStore },
    connectionsService: {
      addContentTab,
      removeContentTab,
      getContentData,
      setContentIdx,
      setConnectionIdx,
    },
  } = useAppSelector();

  const actionsContext: ActionsContext = {
    showThemeSwitcher() {
      toggleThemeSwitcher();
      if (appStore.showThemeSwitcher)
        document.getElementById("theme-switch")?.focus();
    },
  };

  onMount(() => {
    document.onkeyup = function(e: KeyboardEvent) {
      const number = e.code.startsWith("Digit")
        ? +e.code.replace("Digit", "")
        : null;
      const { ctrlKey, metaKey, altKey, key, preventDefault, code } = e;
      if (
        (ctrlKey || metaKey || altKey) &&
        number &&
        number > 0 &&
        number <= 9
      ) {
        preventDefault();
        if (altKey) setContentIdx(number);
        else setConnectionIdx(number - 1);
      } else if ((ctrlKey || metaKey) && code === "KeyT") {
        e.preventDefault();
        if (e.shiftKey) removeContentTab();
        else addContentTab();
      } else if (code === "KeyE" && (ctrlKey || metaKey)) {
        commandPaletteEmitter.emit("execute", undefined);
      } else if (
        key === "p" &&
        ctrlKey &&
        getContentData("Query").result_sets.length
      ) {
        commandPaletteEmitter.emit("prev-result-set", undefined);
      } else if (
        key === "n" &&
        ctrlKey &&
        getContentData("Query").result_sets.length
      ) {
        commandPaletteEmitter.emit("next-result-set", undefined);
      }
    };
  });

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
