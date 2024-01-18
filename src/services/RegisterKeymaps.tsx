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
      contentStore,
      setNextContentIdx,
      setPrevContentIdx,
      setConnectionIdx,
    },
    app: { setComponent, setAppStore },
  } = useAppSelector();
  const isMac = props.osType === 'Darwin';
  const CmdOrCtrl = isMac ? 'Meta' : 'Control';
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

  createShortcut([CmdOrCtrl, 't'], () => {
    addContentTab();
  });

  createShortcut([CmdOrCtrl, 'w'], () => {
    removeContentTab(contentStore.idx);
  });

  createShortcut(['Control', 'Tab'], () => {
    setNextContentIdx();
  });

  createShortcut(['Control', 'Shift', 'Tab'], () => {
    setPrevContentIdx();
  });

  for (let i = 1; i <= 9; i++) {
    createShortcut(['Control', String(i)], () => {
      setConnectionIdx(i - 1);
    });
  }

  return props.children;
};
