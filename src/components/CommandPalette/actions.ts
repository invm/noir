import { createEmitter } from "@solid-primitives/event-bus";
import { defineAction } from "solid-command-palette";
import { t } from "utils/i18n";

export const commandPaletteEmitter = createEmitter<{
  "focus-query-text-area": boolean;
  "next-result-set": undefined;
  "prev-result-set": undefined;
  execute: undefined;
}>();

const focusOn = defineAction({
  id: "focus_on",
  title: t("command_palette.focus_on"),
});

const focusQueryTextArea = defineAction({
  id: "focus_query_text_area",
  title: t("command_palette.focus_query_text_area"),
  parentActionId: focusOn.id,
  /* Condition for allowing action */
  shortcut: "$mod+d", // $mod = Command on Mac & Control on Windows.
  run: () => {
    commandPaletteEmitter.emit("focus-query-text-area", true);
  },
});

export const actions = {
  [focusQueryTextArea.id]: focusQueryTextArea,
  [focusOn.id]: focusOn,
};
