import { Alert } from 'components/UI';
import { useAppSelector } from 'services/Context';
import { createShortcut } from '@solid-primitives/keyboard';
import { ChevronLeft, ChevronRight } from 'components/UI/Icons';
import { t } from 'utils/i18n';
import { Accessor, createEffect, on, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ResultSet } from 'interfaces';

type PaginationProps = {
  page: Accessor<number>;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const Pagination = (props: PaginationProps) => {
  const {
    connections: { selectNextQuery, selectPrevQuery, queryIdx, getContentData },
    backend: { pageSize },
  } = useAppSelector();

  createShortcut(['Control', 'Shift', 'N'], selectNextQuery);
  createShortcut(['Control', 'Shift', 'P'], selectPrevQuery);

  const [resultSet, setResultSet] = createStore<ResultSet>({});

  createEffect(
    on(queryIdx, () => {
      const rs = getContentData('Query').result_sets[queryIdx()];
      if (rs) setResultSet(rs);
    })
  );

  createEffect(() => {
    console.log('query idx', queryIdx());
  });

  return (
    <div class="container flex justify-between items-top p-1 my-1 gap-2 bg-base-200">
      <div class="flex gap-2">
        <div class="join">
          <button class="join-item btn btn-sm" onClick={selectPrevQuery}>
            <ChevronLeft />
          </button>
          <button class="join-item btn btn-sm btn-disabled !text-info">
            <span class="mt-1">
              {t('console.result_set')} {queryIdx() + 1}
            </span>
          </button>
          <button class="join-item btn btn-sm" onClick={selectNextQuery}>
            <ChevronRight />
          </button>
        </div>
        <div class="flex-1">
          <Show when={resultSet?.info}>
            <Alert color="info">{resultSet?.info}</Alert>
          </Show>
        </div>
      </div>

      <Show when={!resultSet?.info}>
        <div class="join">
          <button
            class="join-item btn btn-sm"
            disabled={!props.page()}
            onClick={props.onPrevPage}
          >
            <ChevronLeft />
          </button>
          <button class="join-item btn btn-sm btn-disabled !text-base-content">
            {props.page() + 1}
          </button>
          <button
            class="join-item btn btn-sm"
            disabled={
              props.page() * pageSize() + pageSize() >= (resultSet?.count ?? 0)
            }
            onClick={props.onNextPage}
          >
            <ChevronRight />
          </button>
        </div>
      </Show>
    </div>
  );
};
