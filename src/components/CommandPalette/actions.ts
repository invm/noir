import { createEmitter } from "@solid-primitives/event-bus";
import { defineAction } from "solid-command-palette";
import { t } from "utils/i18n";
import { ActionsContext } from "./CommandPaletteContext";

export const commandPaletteEmitter = createEmitter<{
  "focus-query-text-area": boolean;
}>();

const showThemeSwitcher = defineAction({
  id: "toggle_theme_switcher",
  title: t("command_palette.toggle_theme_switcher"),
  run: ({ rootContext }) => {
    (rootContext as ActionsContext).showThemeSwitcher();
  },
});

const focusOn = defineAction({
  id: "focus_on",
  title: t("command_palette.focus_on"),
});

const focusQueryTextArea = defineAction({
  id: "focus_query_text_area",
  title: t("command_palette.focus_query_text_area"),
  parentActionId: focusOn.id,
  /* Condition for allowing action */
  //   shortcut: "$mod+e", // $mod = Command on Mac & Control on Windows.
  run: () => {
    commandPaletteEmitter.emit("focus-query-text-area", true);
  },
});

export const actions = {
  [showThemeSwitcher.id]: showThemeSwitcher,
  [focusQueryTextArea.id]: focusQueryTextArea,
  [focusOn.id]: focusOn,
};
