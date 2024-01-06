import Keymaps from 'components/UI/Keymaps';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';

import { version } from '../../../../package.json';

export const Settings = () => {
  const {
    connections: { clearStore },
  } = useAppSelector();

  return (
    <div class="p-4 bg-base-300 flex-1">
      <h1 class="text-2xl font-bold">{t('settings.settings')}</h1>
      <div class="flex gap-4 py-4">
        <button class="btn btn-sm btn-secondary" onClick={async () => await clearStore()}>
          {t('settings.clear_cache')}
        </button>
      </div>
      <div class="flex flex-col items-center">
        <h2 class="text-xl font-bold mt-4">{t('settings.shortcuts')}</h2>
        <Keymaps />
      </div>
      <div class="flex flex-col items-center">
        <div class="flex items-center justify-center w-full py-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Made with ❤️ by{' '}
            <a href="https://github.com/invm/noir" target="_blank" class="underline">
              invm
            </a>
          </span>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">Version: {version}</span>
      </div>
    </div>
  );
};
