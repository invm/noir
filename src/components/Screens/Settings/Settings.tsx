import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';

import { version } from '../../../../package.json';
import Keymaps from './Keymaps';
import { OpenIssue } from './OpenIssue';

export const Settings = () => {
  const {
    connections: { clearStore },
    app: { setScreen },
  } = useAppSelector();

  return (
    <div class="p-4 bg-base-300 flex-1">
      <div class="flex flex-col items-center pb-4">
        <div>
          <span class="text-md font-semibold text-primary">
            🕵️ Noir - keyboard driven database management client for Postgresql, MySQL, MariaDB and SQLite.
          </span>
        </div>
        <OpenIssue />
        <h2 class="text-xl font-bold mt-4">{t('settings.shortcuts')}</h2>
        <Keymaps
          short
          suffix={
            <button onClick={() => setScreen('keymaps')} class="btn btn-sm btn-primary w-md mt-2">
              {t('keymaps.see_all')}
            </button>
          }
        />
      </div>
      <div class="flex flex-col items-center">
        <div class="flex items-center justify-center w-full py-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Made with 🩸 🥵 and 😭 by{' '}
            <a href="https://github.com/invm/noir" target="_blank" class="underline">
              invm
            </a>
          </span>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">Version: {version}</span>
        <div class="flex gap-4 py-4">
          <button class="btn btn-xs btn-accent" onClick={clearStore}>
            {t('settings.clear_cache')}
          </button>
        </div>
      </div>
    </div>
  );
};
