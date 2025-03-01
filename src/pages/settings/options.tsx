import { MultiSelect } from 'components/ui/multi-select';
import { QueryTypes } from 'interfaces';
import { Tooltip } from '@kobalte/core/tooltip';
import { TooltipTrigger, TooltipContent } from 'components/ui/tooltip';
import { CgInfo } from 'solid-icons/cg';
import { useAppSelector } from 'services/Context';

export function Options() {
  const {
    app: { appStore, updateSensitiveQueries },
  } = useAppSelector();

  return (
    <div class="h-full">
      <h2 class="text-2xl font-bold mb-4 text-foreground">Options</h2>
      <div class="space-y-4">
        <Tooltip>
          <TooltipTrigger class="flex items-center text-sm gap-2">
            <span>Sensitive queries</span>
            <CgInfo class="size-4" />
            <TooltipContent>
              The queries specified below will popup a confirmation dialog
              before executing the query
            </TooltipContent>
          </TooltipTrigger>
        </Tooltip>
        <div class="w-[400px]">
          <MultiSelect
            options={QueryTypes}
            selected={appStore.sensitiveQueries}
            onChange={(options) => updateSensitiveQueries(options)}
            placeholder="Select query types..."
          />
        </div>
      </div>
    </div>
  );
}
