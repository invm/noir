import { ConnectionsService } from 'services/Connections';
import { t } from 'utils/i18n';
import { OpenIssue } from '../pages/settings/open-issue';
import { relaunch } from '@tauri-apps/api/process';
import { info } from 'tauri-plugin-log-api';
import { Button } from './ui/button';

const Error = (props: { err: Record<'message' | 'stack', string> }) => {
  info(JSON.stringify({ error: props.err, stack: props.err?.stack }));

  return (
    <div class="flex flex-col items-center justify-center h-full w-full px-20">
      <h2 class="text-xl font-bold text-error">
        {t('error.something_went_wrong')}
      </h2>
      <OpenIssue />
      <br />
      <Button
        size="sm"
        variant="outline"
        onClick={async () => await ConnectionsService().clearStore()}
      >
        {t('settings.clear_cache')}
      </Button>
      <br />
      <Button size="sm" onClick={relaunch}>
        {t('error.relaunch_app')}
      </Button>
      <span class="text-lg pt-10">{props.err.message}</span>
      <br />
      <h4 class="text-xl font-bold text-error">{t('error.stack')}</h4>
      <span class="text-lg">{props.err.stack.substring(0, 2000)}</span>
    </div>
  );
};

export { Error };
