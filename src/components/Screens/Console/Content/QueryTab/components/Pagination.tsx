import { Alert } from 'components/UI';
import { useAppSelector } from 'services/Context';
import { createShortcut } from '@solid-primitives/keyboard';
import { ChevronLeft, ChevronRight } from 'components/UI/Icons';
import { t } from 'utils/i18n';
import { Accessor, createEffect, For, Match, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ResultSet } from 'interfaces';

type PaginationProps = {
  page: Accessor<number>;
  loading: boolean;
  setPage: (n: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const Pagination = (props: PaginationProps) => {
  const {
    connections: { selectNextQuery, selectPrevQuery, queryIdx, getContentData },
    backend: { pageSize, setPageSize },
  } = useAppSelector();

  createShortcut(['Control', 'Shift', 'N'], selectNextQuery);
  createShortcut(['Control', 'Shift', 'P'], selectPrevQuery);
  createShortcut(['Control', 'N'], props.onNextPage);
  createShortcut(['Control', 'P'], props.onPrevPage);

  const [resultSet, setResultSet] = createStore<ResultSet>({});

  createEffect(() => {
    const rs = getContentData('Query').result_sets[queryIdx()];
    if (rs) setResultSet(rs);
  });

  return (
    <div class="container flex justify-between items-top gap-2 bg-base-200">
      <div class="flex gap-2">
        <Show when={getContentData('Query').result_sets.length > 1}>
          <div class="join">
            <div class="tooltip tooltip-primary tooltip-right" data-tip={t('console.actions.previous_result_set')}>
              <button class="join-item btn btn-sm" onClick={selectPrevQuery}>
                <ChevronLeft />
              </button>
            </div>
            <button class="join-item !text-info text-md text-upper">
              <span class="mt-1">
                {t('console.result_set')} #{queryIdx() + 1}
              </span>
            </button>
            <div class="tooltip tooltip-primary tooltip-right" data-tip={t('console.actions.next_result_set')}>
              <button class="join-item btn btn-sm" onClick={selectNextQuery}>
                <ChevronRight />
              </button>
            </div>
          </div>
          <div class="flex-1">
            <Show when={resultSet?.status === 'Completed' && resultSet.info}>
              <Alert color="info">{resultSet?.status === 'Completed' && resultSet?.info}</Alert>
            </Show>
          </div>
        </Show>
      </div>
      <Show when={resultSet.status === 'Completed' && !resultSet.info}>
        <div class="join flex items-center">
          <div class="px-3">
            <select
              value={pageSize()}
              onChange={(e) => {
                setPageSize(+e.currentTarget.value);
                props.setPage(0);
              }}
              class="select select-accent select-bordered select-xs w-full">
              <For each={PAGE_SIZE_OPTIONS}>
                {(n) => (
                  <option class="py-1" value={n}>
                    {n}
                  </option>
                )}
              </For>
            </select>
          </div>
          <div class="tooltip tooltip-primary tooltip-left" data-tip={t('console.actions.previous_page')}>
            <button class="join-item btn btn-sm" disabled={props.loading || !props.page()} onClick={props.onPrevPage}>
              <ChevronLeft />
            </button>
          </div>
          <button disabled class="join-item btn btn-sm btn-disabled !text-base-content w-[50px]">
            <Switch>
              <Match when={props.loading}>
                <span class="loading text-primary loading-bars loading-xs"></span>
              </Match>
              <Match when={!props.loading}>
                <span>{props.page() + 1}</span>
              </Match>
            </Switch>
          </button>

          <div class="tooltip tooltip-primary tooltip-left" data-tip={t('console.actions.next_page')}>
            <button
              class="join-item btn btn-sm"
              disabled={props.loading || props.page() * pageSize() + pageSize() >= (resultSet?.count ?? 0)}
              onClick={props.onNextPage}>
              <ChevronRight />
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
