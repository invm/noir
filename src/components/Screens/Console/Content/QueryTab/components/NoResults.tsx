import { t } from "utils/i18n";

export const NoResults = () => {
  return (
    <div class="w-full py-6 flex items-center justify-center">
      <h2 class="text-xl font-medium text-error">{t('console.no_results')}</h2>
    </div>
  );
};
