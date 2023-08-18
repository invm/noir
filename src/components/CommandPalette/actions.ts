import { createEmitter } from "@solid-primitives/event-bus";
import { defineAction } from "solid-command-palette";
import { ActionsContext } from "./CommandPaletteContext";

export const commandPaletteEmitter = createEmitter<{
  "focus-query-text-area": boolean;
}>();

const showThemeSwitcher = defineAction({
  id: "toggle-theme-switcher",
  title: "Toggle Theme Switcher",
  run: ({ rootContext }) => {
    (rootContext as ActionsContext).showThemeSwitcher();
  },
});

const focusOn = defineAction({
  id: "focus-on",
  title: "Focus On",
});

const focusQueryTextArea = defineAction({
  id: "focus-query-text-area",
  title: "Focus On Query Text Area",
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
