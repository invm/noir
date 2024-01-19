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
    app: { setComponent, setAppStore, cmdOrCtrl },
  } = useAppSelector();
  const isMac = props.osType === 'Darwin';
  setAppStore({ osType: props.osType });

  if (isMac) {
    for (let i = 1; i <= 9; i++) {
      createShortcut(['Meta', String(i)], () => {
        setContentIdx(i - 1);
      });
    }
  } else {
    for (let i = 1; i <= 9; i++) {
      createShortcut(['Alt', String(i)], () => {
        setContentIdx(i - 1);
      });
    }
  }

  createShortcut(['F1'], () => {
    setComponent((s) => (s === 1 ? 0 : 1));
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
    setConnectionIdx(-1);
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Control', String(i)], () => {
      setConnectionIdx(i - 1);
    });
  }

  return props.children;
};
