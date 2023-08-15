import { actions } from "./actions";
import { useAppSelector } from "services/Context";
import { CommandPalette, Root } from "solid-command-palette";
import { JSX } from "solid-js/jsx-runtime";

export const CommandPaletteContext = (props: { children: JSX.Element }) => {
  const {
    appService: { toggleThemeSwitcher },
  } = useAppSelector();

  const actionsContext = {
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
