import { createEmitter } from "@solid-primitives/event-bus";
import { defineAction } from "solid-command-palette";

export const commandPaletteEmitter = createEmitter<{
  "focus-query-text-area": boolean;
}>();

const showThemeSwitcher = defineAction({
  id: "toggle-theme-switcher",
  title: "Toggle Theme Switcher",
  run: ({ rootContext }) => {
    (rootContext as any).showThemeSwitcher();
  },
});

const focusQueryTextArea = defineAction({
  id: "focus-query-text-area",
  title: "Focus Query Text Area",
  // TODO: add contidion to show this action
  run: () => {
    commandPaletteEmitter.emit("focus-query-text-area", true);
  },
});

// const incrementCounterAction = defineAction({
//   id: "increment-counter",
//   title: "Increment Counter by 1",
//   subtitle: "Press CMD + E to trigger this.",
//   shortcut: "$mod+e", // $mod = Command on Mac & Control on Windows.
//   run: ({ rootContext }) => {
//     (rootContext as ActionsContext).increment();
//   },
// });

export const actions = {
  [showThemeSwitcher.id]: showThemeSwitcher,
  [focusQueryTextArea.id]: focusQueryTextArea,
  // [incrementCounterAction.id]: incrementCounterAction,
};
