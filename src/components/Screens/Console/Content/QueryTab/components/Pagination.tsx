import { createShortcut } from '@solid-primitives/keyboard';
import { Accessor, createEffect, Match, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { QueryType, ResultSet } from 'interfaces';
import { ChevronLeft, ChevronRight } from 'components/UI-old/Icons';
import { Alert } from 'components/ui/alert';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import { DrawerState } from '../Table/PopupCellRenderer';
import { Button } from 'components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { Loader } from 'components/ui/loader';

type PaginationProps = {
  page: Accessor<number>;
  loading: boolean;
  changesCount: number;
  onPageSizeChange: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onBtnExport: (t: 'csv' | 'json') => void;
  applyChanges: () => void;
  undoChanges: () => void;
  openDrawerForm?: (s: Pick<DrawerState, 'mode' | 'rowIndex' | 'data'>) => void;
  query: {
    hasResults: boolean;
    count: number;
    executionTime?: number;
    affectedRows?: number;
    queryType: QueryType;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const Pagination = (props: PaginationProps) => {
  const {
    connections: { selectNextQuery, selectPrevQuery, queryIdx, getContentData },
    backend: { pageSize, setPageSize },
    app: { altOrMeta, cmdOrCtrl },
  } = useAppSelector();

  createShortcut(['Control', 'Shift', 'E'], selectNextQuery);
  createShortcut(['Control', 'Shift', 'Q'], selectPrevQuery);
  createShortcut([cmdOrCtrl(), 'Shift', 'N'], props.onNextPage);
  createShortcut([cmdOrCtrl(), 'Shift', 'P'], props.onPrevPage);
  createShortcut(['Control', 'Shift', 'J'], () => props.onBtnExport('json'));
  createShortcut(['Control', 'Shift', 'C'], () => props.onBtnExport('csv'));
  createShortcut([altOrMeta(), 'N'], () =>
    props.openDrawerForm
      ? props.openDrawerForm({ mode: 'add', data: {} })
      : null
  );

  const [resultSet, setResultSet] = createStore<ResultSet>({ loading: false });

  createEffect(() => {
    const rs = getContentData('Query').result_sets[queryIdx()];
    if (rs) setResultSet(rs);
  });

  return (
    <div class="w-full flex justify-between gap-2 bg-base-100 px-2">
      <div class="flex items-center gap-2">
        <Show when={getContentData('Query').result_sets.length > 1}>
          <div class="join">
            <div
              class="join-item tooltip tooltip-primary tooltip-right"
              data-tip={t('console.actions.previous_result_set')}
            >
              <button class="join-item btn btn-sm" onClick={selectPrevQuery}>
                <ChevronLeft />
              </button>
            </div>
            <button class="join-item !text-info text-md text-upper px-4 mx-1">
              <span class="mt-1">
                {t('console.result_set')} #{queryIdx() + 1}
              </span>
            </button>
            <div
              class="join-item tooltip tooltip-primary tooltip-right"
              data-tip={t('console.actions.next_result_set')}
            >
              <button class="join-item btn btn-sm" onClick={selectNextQuery}>
                <ChevronRight />
              </button>
            </div>
          </div>
          <div class="flex-1">
            <Show
              when={
                resultSet?.status === 'Completed' && resultSet.affected_rows
              }
            >
              <Alert color="info">
                {resultSet?.status === 'Completed' &&
                  resultSet?.affected_rows +
                    ' ' +
                    t('console.table.affected_rows')}
              </Alert>
            </Show>
          </div>
        </Show>

        <Show when={props.query.count > 0}>
          <span class="text-xs text-base-content">
            {t('console.table.total_rows')} {props.query.count}
          </span>
        </Show>
        <Show when={props.query.executionTime}>
          <span class="text-xs font-medium">
            {t('console.table.ran', { duration: props.query.executionTime })}
          </span>
        </Show>
        <Show when={props.query.queryType === 'Other'}>
          <span class="font-medium">|</span>
          <span class="text-xs font-medium">
            {t('console.table.affected_rows', {
              rows: props.query.affectedRows,
            })}
          </span>
        </Show>
        <Show when={props.openDrawerForm}>
          <div
            class="tooltip tooltip-primary tooltip-bottom px-3"
            data-tip={altOrMeta(true) + ' + N'}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                props.openDrawerForm
                  ? props.openDrawerForm({ mode: 'add', data: {} })
                  : null
              }
            >
              {t('console.table.row_actions.add_row')}
            </Button>
          </div>
        </Show>
      </div>
      <Show when={resultSet.status === 'Completed'}>
        <div class="flex items-center gap-2 py-0.5">
          <Show when={props.changesCount > 0}>
            <div class="px-2 gap-4 flex">
              <Button size="sm" variant="outline" onClick={props.undoChanges}>
                {t('console.actions.reset')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={props.applyChanges}
              >
                {t('console.actions.apply')} {props.changesCount}{' '}
                {t(
                  `console.actions.${props.changesCount > 1 ? 'changes' : 'change'}`
                )}
              </Button>
            </div>
          </Show>
          <Show when={props.query.hasResults}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => props.onBtnExport('csv')}
            >
              {t('console.table.csv')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => props.onBtnExport('json')}
            >
              {t('console.table.json')}
            </Button>
          </Show>
          <Select
            class="w-20"
            options={PAGE_SIZE_OPTIONS}
            value={pageSize()}
            // onChange={(value) => {
            //   setFields(
            //     'color',
            //     value as (typeof connectionColors)[number]
            //   );
            // }}
            onChange={(value) => {
              setPageSize(value || PAGE_SIZE_OPTIONS[0]);
              props.onPageSizeChange();
            }}
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger class="h-8 w-full">
              <SelectValue>
                {(state) => state.selectedOption() as string}
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="max-h-48 overflow-auto" />
          </Select>
          <div class="flex items-center gap-2 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              disabled={props.loading || !props.page()}
              onClick={props.onPrevPage}
              class="text-primary"
            >
              <ChevronLeft />
            </Button>
            <span class="text-sm text-white min-w-8 text-center">
              <Switch>
                <Match when={props.loading}>
                  <Loader />
                </Match>
                <Match when={!props.loading}>
                  <span>{props.page() + 1}</span>
                </Match>
              </Switch>
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={
                props.loading ||
                props.page() * pageSize() + pageSize() >=
                  (resultSet?.count ?? 0)
              }
              onClick={props.onNextPage}
              class="text-primary"
            >
              <ChevronRight />
              <span class="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
};
