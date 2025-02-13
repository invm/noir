import {
  createComponent,
  onMount,
  onCleanup,
  JSX,
  createEffect,
} from 'solid-js';
import { useCommandPalette } from './context';

interface CommandPaletteContextWrapperProps {
  actions: { id: string; label: string; callback: () => void }[];
  children: JSX.Element;
}

export function CommandPaletteContextWrapper(
  props: CommandPaletteContextWrapperProps
) {
  const commandPalette = useCommandPalette();
  let currentActionIds: string[] = []; // Keep track of the currently added action IDs

  onMount(() => {
    // Initial addition of actions
    commandPalette.addActions(props.actions);
    currentActionIds = props.actions.map((action) => action.id);
  });

  createEffect(() => {
    // React to changes in the actions prop
    const newActionIds = props.actions.map((action) => action.id);

    // Remove actions that are no longer present
    const actionsToRemove = currentActionIds.filter(
      (id) => !newActionIds.includes(id)
    );
    if (actionsToRemove.length > 0) {
      commandPalette.removeActions(actionsToRemove);
    }

    // Add actions that are new
    const actionsToAdd = props.actions.filter(
      (action) => !currentActionIds.includes(action.id)
    );
    if (actionsToAdd.length > 0) {
      commandPalette.addActions(actionsToAdd);
    }

    // Update the current action IDs
    currentActionIds = newActionIds;
  });

  onCleanup(() => {
    // Remove all actions when the component unmounts
    commandPalette.removeActions(currentActionIds);
  });

  return createComponent(() => props.children, {});
}
