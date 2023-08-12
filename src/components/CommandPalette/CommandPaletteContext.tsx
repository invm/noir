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
      // FIXME: focuses only on first render
      document.getElementById("theme-switch")?.focus();
    },
  };

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
