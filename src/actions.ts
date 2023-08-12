import { useAppSelector } from "services/Context";
import { ActionContext, defineAction } from "solid-command-palette";

const showThemeSwitcher = defineAction({
  id: "toggle-theme-switcher",
  title: "Toggle Theme Switcher",
  run: ({ rootContext }) => {
    (rootContext as any).showThemeSwitcher();
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
  // [incrementCounterAction.id]: incrementCounterAction,
};

