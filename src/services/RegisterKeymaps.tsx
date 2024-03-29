import { createShortcut } from '@solid-primitives/keyboard';
import { OsType } from '@tauri-apps/api/os';
import { JSXElement } from 'solid-js';
import { useAppSelector } from './Context';

export const RegisterKeymaps = (props: { children: JSXElement; osType: OsType }) => {
  const {
    connections: {
      addContentTab,
      removeContentTab,
      setContentIdx,
      setNextContentIdx,
      setPrevContentIdx,
      setConnectionIdx,
    },
    app: { setScreen, toggleScreen, setAppStore, cmdOrCtrl, altOrMeta },
  } = useAppSelector();
  setAppStore({ osType: props.osType });

  for (let i = 1; i <= 9; i++) {
    createShortcut([altOrMeta(), String(i)], () => {
      setContentIdx(i - 1);
    });
  }

  createShortcut(['F1'], () => {
    toggleScreen('keymaps');
  });

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

  createShortcut(['Control', '`'], () => {
    setScreen('home');
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Control', String(i)], () => {
      setScreen('console');
      setConnectionIdx(i - 1);
    });
  }

  return props.children;
};
