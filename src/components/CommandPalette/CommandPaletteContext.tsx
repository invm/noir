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
      console.log(e.code, e.key, e.metaKey, e.ctrlKey, e.altKey, e.shiftKey);
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
      }
    };

    commandPaletteEmitter.on("select-connection-tab", (val) => {
      console.log({ val, actions: "select-connection-tab" });
    });
    commandPaletteEmitter.on("select-query-tab", (val) => {
      console.log({ val, actions: "select-connection-tab" });
    });
  });

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
