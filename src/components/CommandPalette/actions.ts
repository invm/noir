import { defineAction } from "solid-command-palette";
import { t } from "utils/i18n";

const focusOn = defineAction({
  id: "focus_on",
  title: t('command_palette.focus_on'),
});

const focusQueryTextArea = defineAction({
  id: "focus_query_text_area",
  title: t('command_palette.focus_query_text_area'),
  parentActionId: focusOn.id,
  /* Condition for allowing action */
  shortcut: "$mod+l", // $mod = Command on Mac & Control on Windows.
  run: () => {
    // document.dispatchEvent(
    //   new KeyboardEvent('keydown', {
    //     code: "KeyL", // put everything you need in this object.
    //     ctrlKey: true, // if you aren't going to use them.
    //   })
    // );
  },
});

export const actions = {
  [focusQueryTextArea.id]: focusQueryTextArea,
  [focusOn.id]: focusOn,
};
