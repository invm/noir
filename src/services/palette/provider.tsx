import { ParentComponent } from 'solid-js';
import { createCommandPaletteContext } from './context';

const [CommandPaletteProvider, getCommandPaletteContext] =
  createCommandPaletteContext();

export const CommandPaletteProviderComponent: ParentComponent = (props) => {
  return (
    <CommandPaletteProvider value={getCommandPaletteContext()}>
      {props.children}
    </CommandPaletteProvider>
  );
};
