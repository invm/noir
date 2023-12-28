import { actions } from './actions';
import { useAppSelector } from 'services/Context';
import { CommandPalette, Root } from 'solid-command-palette';
import { JSX } from 'solid-js/jsx-runtime';
import { createShortcut } from '@solid-primitives/keyboard';

export interface ActionsContext {
  [key: string]: unknown;
}

export const CommandPaletteContext = (props: { children: JSX.Element }) => {
  const {
    connections: { addContentTab, removeContentTab, setContentIdx, contentStore },
  } = useAppSelector();

  const actionsContext: ActionsContext = {};

  createShortcut(['Meta', 'w'], () => {
    removeContentTab(contentStore.idx);
  });

  createShortcut(['Meta', 't'], () => {
    addContentTab();
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Meta', String(i)], () => {
      setContentIdx(i - 1);
    });
  }

  return (
    <Root actions={actions} actionsContext={actionsContext}>
      <CommandPalette />
      {props.children}
    </Root>
  );
};
