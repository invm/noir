import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';

export const Settings = () => {
  const {
    connections: { clearStore },
  } = useAppSelector();

  return (
    <div class="p-4 bg-base-300 flex-1">
      <h1 class="text-2xl font-bold">{t('settings.settings')}</h1>
      <div class="flex gap-4">
        <button class="btn btn-sm btn-secondary" onClick={async () => await clearStore()}>
          {t('settings.clear_cache')}
        </button>
      </div>
      <h2 class="text-xl font-bold mt-4">{t('settings.shortcuts')}</h2>
    </div>
  );
};
