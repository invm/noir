import { actions, commandPaletteEmitter } from "./actions";
import { useAppSelector } from "services/Context";
import { CommandPalette, Root } from "solid-command-palette";
import { JSX } from "solid-js/jsx-runtime";
import { onMount } from "solid-js";
import { QueryContentTabData } from "services/ConnectionTabs";

export interface ActionsContext {
  showThemeSwitcher: () => void;
  [key: string]: any;
}

export const CommandPaletteContext = (props: { children: JSX.Element }) => {
  const {
    appService: { toggleThemeSwitcher },
    connectionsService: {
      setActiveContentTab,
      setActiveConnection,
      addContentTab,
      removeActiveContentTab,
      getActiveContentTab,
    },
  } = useAppSelector();

  const actionsContext: ActionsContext = {
    showThemeSwitcher() {
      toggleThemeSwitcher();
      // always focus with a timeout because of the command palette, it is the active element
      setTimeout(() => {
        document.getElementById("theme-switch")?.focus();
      }, 1);
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
        if (altKey) setActiveContentTab(number);
        else setActiveConnection(number - 1);
      } else if ((ctrlKey || metaKey) && code === "KeyT") {
        e.preventDefault();
        if (e.shiftKey) removeActiveContentTab();
        else addContentTab();
      } else if (code === "KeyE" && (ctrlKey || metaKey)) {
        commandPaletteEmitter.emit("execute", undefined);
      } else if (
        key === "p" &&
        ctrlKey &&
        (getActiveContentTab().data as QueryContentTabData).result_sets.length
      ) {
        commandPaletteEmitter.emit("prev-result-set", undefined);
      } else if (
        key === "n" &&
        ctrlKey &&
        (getActiveContentTab().data as QueryContentTabData).result_sets.length
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
