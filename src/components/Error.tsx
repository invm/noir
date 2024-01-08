import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import { OpenIssue } from './Screens/Settings/OpenIssue';

const Error = (props: { err: Record<'message' | 'stack', string> }) => {
  console.log({ error: props.err, stack: props.err?.stack });

  const {
    connections: { clearStore },
  } = useAppSelector();

  return (
    <div class="flex flex-col items-center justify-center h-full w-full">
      <h2 class="text-xl font-bold"> Something went wrong </h2>
      <OpenIssue />
      <br />

      <button class="btn btn-sm btn-secondary" onClick={async () => await clearStore()}>
        {t('settings.clear_cache')}
      </button>
      <span class="text-lg">{props.err.message}</span>
      <br />
      <h4>Stack: </h4>
      <span class="text-lg">{props.err.stack}</span>
    </div>
  );
};

export { Error };
