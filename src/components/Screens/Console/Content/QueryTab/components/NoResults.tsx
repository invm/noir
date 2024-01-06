import { t } from 'utils/i18n';

export const NoResults = (props: { error?: string }) => {
  return (
    <div class="h-full w-full py-6 flex items-center justify-center">
      <h2 class="text-xl font-medium text-error">{props.error ?? t('console.no_results')}</h2>
    </div>
  );
};
