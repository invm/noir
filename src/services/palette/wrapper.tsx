import {
  createComponent,
  onMount,
  onCleanup,
  JSX,
  createEffect,
} from 'solid-js';
import { Action, ActionGroup, useCommandPalette } from './context';

interface CommandPaletteContextWrapperProps {
  actions?: Action[];
  groups?: ActionGroup[];
  children: JSX.Element;
}

export function CommandPaletteContextWrapper(
  props: CommandPaletteContextWrapperProps
) {
  const commandPalette = useCommandPalette();
  let currentActionIds: string[] = [];
  let currentGroupIds: string[] = [];

  onMount(() => {
    if (props.actions) {
      commandPalette.addActions(props.actions);
      currentActionIds = props.actions.map((action) => action.id);
    }
    if (props.groups) {
      commandPalette.addGroups(props.groups);
      currentGroupIds = props.groups.map((group) => group.id);
    }
  });

  createEffect(() => {
    const newActionIds = props.actions?.map((action) => action.id);

    const actionsToRemove = currentActionIds.filter(
      (id) => !newActionIds?.includes(id)
    );
    if (actionsToRemove.length > 0) {
      commandPalette.removeActions(actionsToRemove);
    }

    const actionsToAdd = props.actions?.filter(
      (action) => !currentActionIds.includes(action.id)
    );
    if (actionsToAdd && actionsToAdd?.length > 0) {
      commandPalette.addActions(actionsToAdd);
    }

    currentActionIds = newActionIds || [];
  });

  createEffect(() => {
    const newGroupIds = props.groups?.map((group) => group.id);

    const groupsToRemove = currentGroupIds.filter(
      (id) => !newGroupIds?.includes(id)
    );
    if (groupsToRemove.length > 0) {
      commandPalette.removeGroups(groupsToRemove);
    }

    const groupsToAdd = props.groups?.filter(
      (group) => !currentGroupIds.includes(group.id)
    );
    if (groupsToAdd && groupsToAdd?.length > 0) {
      commandPalette.addGroups(groupsToAdd);
    }

    currentGroupIds = newGroupIds || [];
  });

  onCleanup(() => {
    commandPalette.removeActions(currentActionIds);
    commandPalette.removeGroups(currentGroupIds);
  });

  return createComponent(() => props.children, {});
}
