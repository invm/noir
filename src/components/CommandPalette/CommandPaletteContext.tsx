import { actions } from "./actions";
import { useAppSelector } from "services/Context";
import { CommandPalette, Root } from "solid-command-palette";
import { JSX } from "solid-js/jsx-runtime";

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

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
