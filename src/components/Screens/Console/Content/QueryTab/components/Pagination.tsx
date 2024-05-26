import { createShortcut } from '@solid-primitives/keyboard';
import { Accessor, createEffect, For, Match, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { QueryType, ResultSet } from 'interfaces';
import { ChevronLeft, ChevronRight } from 'components/UI/Icons';
import { Alert } from 'components/UI';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import { DrawerState } from '../Table/PopupCellRenderer';

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
    <div class="w-full flex justify-between items-top gap-2 bg-base-100 px-2 py-1">
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
        <Show when={props.openDrawerForm}>
          <div
            class="tooltip tooltip-primary tooltip-bottom px-3"
            data-tip={altOrMeta(true) + ' + N'}
          >
            <button
              class="btn btn-xs btn-ghost"
              onClick={() =>
                props.openDrawerForm
                  ? props.openDrawerForm({ mode: 'add', data: {} })
                  : null
              }
            >
              {t('console.table.row_actions.add_row')}
            </button>
          </div>
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
      </div>
      <Show when={resultSet.status === 'Completed'}>
        <div class="flex items-center">
          <Show when={props.changesCount > 0}>
            <div class="px-2 gap-4 flex">
              <button
                class="btn btn-xs btn-outline"
                onClick={props.undoChanges}
              >
                {t('console.actions.reset')}
              </button>
              <button
                onClick={props.applyChanges}
                class="btn btn-xs btn-outline btn-error"
              >
                {t('console.actions.apply')} {props.changesCount}{' '}
                {t(
                  `console.actions.${props.changesCount > 1 ? 'changes' : 'change'}`
                )}
              </button>
            </div>
          </Show>
          <Show when={props.query.hasResults}>
            <button
              class="btn btn-ghost btn-xs"
              onClick={(_) => props.onBtnExport('csv')}
            >
              {t('console.table.csv')}
            </button>
            <button
              class="btn btn-ghost btn-xs"
              onClick={(_) => props.onBtnExport('json')}
            >
              {t('console.table.json')}
            </button>
          </Show>
          <div class="px-3">
            <select
              value={pageSize()}
              onChange={(e) => {
                setPageSize(+e.currentTarget.value);
                props.onPageSizeChange();
              }}
              class="select select-accent select-bordered select-xs w-full"
            >
              <For each={PAGE_SIZE_OPTIONS}>
                {(n) => <option value={n}>{n}</option>}
              </For>
            </select>
          </div>
          <div class="join">
            <div
              class="tooltip tooltip-primary tooltip-left"
              data-tip={t('console.actions.previous_page')}
            >
              <button
                class="join-item btn btn-xs"
                disabled={props.loading || !props.page()}
                onClick={props.onPrevPage}
              >
                <ChevronLeft />
              </button>
            </div>
            <button
              disabled
              class="join-item btn btn-xs btn-disabled !text-base-content w-[50px]"
            >
              <Switch>
                <Match when={props.loading}>
                  <span class="loading text-primary loading-bars loading-xs"></span>
                </Match>
                <Match when={!props.loading}>
                  <span>{props.page() + 1}</span>
                </Match>
              </Switch>
            </button>

            <div
              class="tooltip tooltip-primary tooltip-left"
              data-tip={t('console.actions.next_page')}
            >
              <button
                class="join-item btn btn-xs"
                disabled={
                  props.loading ||
                  props.page() * pageSize() + pageSize() >=
                    (resultSet?.count ?? 0)
                }
                onClick={props.onNextPage}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
