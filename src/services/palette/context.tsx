import {
  Accessor,
  createContext,
  createSignal,
  Setter,
  useContext,
} from 'solid-js';

export interface CommandPaletteAction {
  id: string;
  label: string;
  group?: string;
  callback: () => Promise<void> | void;
}

interface CommandPaletteContextValue {
  actions: () => CommandPaletteAction[];
  addActions: (actions: CommandPaletteAction[]) => void;
  removeActions: (actionIds: string[]) => void;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  actions: () => [],
  addActions: () => {},
  removeActions: () => {},
  open: () => false,
  setOpen: () => {},
});

export function createCommandPaletteContext() {
  const [actions, setActions] = createSignal<CommandPaletteAction[]>([]);
  const [open, setOpen] = createSignal(false);

  const addActions = (newActions: CommandPaletteAction[]) => {
    setActions((prevActions) => [...prevActions, ...newActions]);
  };

  const removeActions = (actionIds: string[]) => {
    setActions((prevActions) =>
      prevActions.filter((action) => !actionIds.includes(action.id))
    );
  };

  const contextValue: CommandPaletteContextValue = {
    actions,
    addActions,
    removeActions,
    open,
    setOpen,
  };

  return [CommandPaletteContext.Provider, () => contextValue] as const;
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
