import {
  Accessor,
  createContext,
  createSignal,
  JSXElement,
  Setter,
  useContext,
} from 'solid-js';

export type Action = {
  id: string;
  icon?: JSXElement;
  label: string;
  shortcut?: JSXElement;
  callback: () => Promise<void> | void;
};

export type ActionGroup = {
  id: string;
  label: string;
  actions: Action[];
};

interface CommandPaletteContextValue {
  actions: () => Action[];
  groups: () => ActionGroup[];
  addActions: (actions: Action[]) => void;
  addGroups: (groups: ActionGroup[]) => void;
  removeActions: (actionIds: string[]) => void;
  removeGroups: (groupIds: string[]) => void;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  actions: () => [],
  groups: () => [],
  addActions: () => {},
  addGroups: () => {},
  removeActions: () => {},
  removeGroups: () => {},
  open: () => false,
  setOpen: () => {},
});

export function createCommandPaletteContext() {
  const [actions, setActions] = createSignal<Action[]>([]);
  const [groups, setGroups] = createSignal<ActionGroup[]>([]);
  const [open, setOpen] = createSignal(false);

  const addActions = (newActions: Action[]) => {
    setActions((prevActions) =>
      [...prevActions, ...newActions].sort(
        (a, b) => a.label.charCodeAt(0) - b.label.charCodeAt(0)
      )
    );
  };

  const addGroups = (newGroups: ActionGroup[]) => {
    setGroups((prevGroups) =>
      [...prevGroups, ...newGroups].sort(
        (a, b) => a.label.charCodeAt(0) - b.label.charCodeAt(0)
      )
    );
  };

  const removeActions = (actionIds: string[]) => {
    setActions((prevActions) =>
      prevActions.filter((action) => !actionIds.includes(action.id))
    );
  };

  const removeGroups = (groupIds: string[]) => {
    setGroups((prevGroups) =>
      prevGroups.filter((group) => !groupIds.includes(group.id))
    );
  };

  const contextValue: CommandPaletteContextValue = {
    actions,
    groups,
    addActions,
    addGroups,
    removeActions,
    removeGroups,
    open,
    setOpen,
  };

  return [CommandPaletteContext.Provider, () => contextValue] as const;
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
