import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';

import { version } from '../../../package.json';
import { Button } from 'components/ui/button';

export const About = () => {
  const {
    connections: { clearStore },
  } = useAppSelector();

  return (
    <div class="flex flex-1 flex-col w-full justify-center items-center">
      <div class="flex flex-col items-center pb-4 max-w-xl gap-4">
        <div>
          <span class="text-md font-semibold text-primary text-center">
            🕵️ Noir - keyboard driven database management client for Postgresql,
            MySQL, MariaDB and SQLite.
          </span>
        </div>
        <Button
          as="a"
          href="https://github.com/invm/noir/issues/new"
          target="_blank"
          variant="outline"
          class="text-destructive"
        >
          Report a bug
        </Button>
        <Button
          as="a"
          href="https://github.com/invm/noir/issues/new"
          target="_blank"
          variant="outline"
          class="text-primary"
        >
          Request a feature?
        </Button>
      </div>
      <div class="flex flex-col items-center">
        <div class="flex items-center justify-center w-full py-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Made with 🩸 🥵 and 😭 by{' '}
            <a
              href="https://github.com/invm/noir"
              target="_blank"
              class="underline"
            >
              invm
            </a>
          </span>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Version: {version}
        </span>
        <div class="flex gap-4 py-4">
          <Button
            size="sm"
            variant="outline"
            class="btn btn-xs btn-accent"
            onClick={clearStore}
          >
            {t('settings.clear_cache')}
          </Button>
        </div>
      </div>
    </div>
  );
};
