import { createShortcut } from '@solid-primitives/keyboard';
import { OsType } from '@tauri-apps/plugin-os';
import { JSXElement } from 'solid-js';
import { useAppSelector } from './Context';

export const RegisterKeymaps = (props: {
  children: JSXElement;
  osType: OsType;
}) => {
  const {
    connections: {
      addContentTab,
      removeContentTab,
      setNextContentIdx,
      setPrevContentIdx,
      setConnectionIdx,
      setContentIdx,
    },
    app: { setAppStore, cmdOrCtrl },
  } = useAppSelector();
  setAppStore({ osType: props.osType });

  createShortcut([cmdOrCtrl(), 't'], () => {
    addContentTab();
  });

  createShortcut([cmdOrCtrl(), 'w'], () => {
    removeContentTab();
  });

  createShortcut(['Control', 'Tab'], () => {
    setNextContentIdx();
  });

  createShortcut(['Control', 'Shift', 'Tab'], () => {
    setPrevContentIdx();
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut([cmdOrCtrl(), String(i)], () => {
      setContentIdx(i - 1);
    });
  }

  for (let i = 1; i <= 9; i++) {
    createShortcut([cmdOrCtrl(), 'Shift', String(i)], () => {
      setConnectionIdx(i - 1);
    });
  }

  return props.children;
};
