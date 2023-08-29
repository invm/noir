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
    appService: { toggleThemeSwitcher },
    connectionsService: {
      setActiveContentTab,
      setActiveConnection,
      addContentTab,
      removeActiveContentTab,
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
      const number =
        e.altKey && e.code.startsWith("Digit")
          ? +e.code.replace("Digit", "")
          : Number.isNaN(+e.key)
            ? null
            : +e.key;
      if (
        (e.ctrlKey || e.metaKey || e.altKey) &&
        number &&
        number > 0 &&
        number <= 9
      ) {
        commandPaletteEmitter.emit(
          e.altKey ? "select-query-tab" : "select-connection-tab",
          number
        );
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyT") {
        if (e.shiftKey) {
          removeActiveContentTab();
        } else {
          addContentTab();
        }
      }
    };

    commandPaletteEmitter.on("select-connection-tab", (val) => {
      setActiveConnection(val - 1);
    });

    commandPaletteEmitter.on("select-query-tab", (val) => {
      setActiveContentTab(val);
    });
  });

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
