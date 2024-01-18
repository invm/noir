import * as z from 'zod';
import { useFormHandler } from 'solid-form-handler';
import { zodSchema } from 'solid-form-handler/zod';
import { createShortcut } from '@solid-primitives/keyboard';
import { Accessor, createEffect, createSignal, For, Match, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ColDef } from 'ag-grid-community';
import { ResultSet } from 'interfaces';
import { ChevronLeft, ChevronRight, CloseIcon } from 'components/UI/Icons';
import { Alert } from 'components/UI';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import sql from 'sql-bricks';
import { invoke } from '@tauri-apps/api';

export const SearchFormSchema = z.object({
  column: z.string().min(1).max(1024),
  operator: z.string().min(1).max(1024).default('='),
  value: z.string().max(2048),
});

type PaginationProps = {
  page: Accessor<number>;
  loading: boolean;
  changesCount: number;
  hasResults: boolean;
  onPageSizeChange: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onBtnExport: (t: 'csv' | 'json') => void;
  applyChanges: () => void;
  resetChanges: () => void;
  count: number;
  table: string;
  columns: ColDef[];
};

const wrapper = (operator: (c: string, v: string) => sql.WhereBinary | sql.WhereExpression) => (c: string, v: string) =>
  operator(c, v);

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
// const COMPARISON_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN'];
const COMPARISON_OPERATORS = {
  '=': {
    label: 'Equals',
    operator: wrapper(sql.eq),
  },
  '!=': {
    label: 'Not Equals',
    operator: wrapper(sql.notEq),
  },
  '>': {
    value: '>',
    label: 'Greater Than',
    operator: wrapper(sql.gt),
  },
  '<': {
    value: '<',
    label: 'Less Than',
    operator: wrapper(sql.lt),
  },
  '>=': {
    value: '>=',
    label: 'Greater Than or Equals',
    operator: wrapper(sql.gte),
  },
  '<=': {
    value: '<=',
    label: 'Less Than or Equals',
    operator: wrapper(sql.lte),
  },
  LIKE: {
    value: 'LIKE',
    label: 'Like',
    operator: wrapper(sql.like),
  },
  'NOT LIKE': {
    value: 'NOT LIKE',
    label: 'Not Like',
    operator: (c: string, v: string) => sql.not(sql.like(c, v)),
  },
  IN: {
    value: 'IN',
    label: 'In',
    operator: wrapper(sql.in),
  },
  'NOT IN': {
    value: 'NOT IN',
    label: 'Not In',
    operator: (c: string, v: string) => sql.not(sql.in(c, v)),
  },
};

export const Pagination = (props: PaginationProps) => {
  const {
    connections: { updateContentTab, getConnection, selectNextQuery, selectPrevQuery, queryIdx, getContentData },
    backend: { pageSize, setPageSize },
    messages: { notify },
  } = useAppSelector();
  const [loading, setLoading] = createSignal(false);
  const formHandler = useFormHandler(zodSchema(SearchFormSchema));
  const { formData, setFieldValue } = formHandler;

  createShortcut(['Control', 'Shift', 'N'], selectNextQuery);
  createShortcut(['Control', 'Shift', 'P'], selectPrevQuery);
  createShortcut(['Control', 'N'], props.onNextPage);
  createShortcut(['Control', 'P'], props.onPrevPage);

  const [resultSet, setResultSet] = createStore<ResultSet>({});

  createEffect(() => {
    const rs = getContentData('Query').result_sets[queryIdx()];
    if (rs) setResultSet(rs);
  });

  const submit = async (event: Event) => {
    try {
      event.preventDefault();
      await formHandler.validateForm();
    } catch (e) {
      // @ts-ignore
      for (const { path, message } of e.validationResult) {
        if (path !== '__ROOT__') notify(path + ' ' + message);
      }
      return;
    }
    try {
      setLoading(true);
      const t = new RegExp(`\\"${props.table}\\"`, 'i');
      const { column, operator, value } = formData();
      const op = COMPARISON_OPERATORS[operator as keyof typeof COMPARISON_OPERATORS].operator;
      const c = new RegExp(`\\"${column}\\"`, 'i');
      const where = op(column, value);
      let query = sql.select().from(props.table);
      if (value) query = query.where(where);
      const res = await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query: query.toString().replace(t, props.table).replace(c, column),
      });
      updateContentTab('data', { result_sets: [res] });
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (props.columns.length > 0 && !formData().column) {
      setFieldValue('column', props.columns[0].headerName);
    }
  }, [props.columns]);

  return (
    <div class="flex flex-col">
      <div class="w-full flex justify-between items-top gap-2 bg-base-100 px-2 py-1">
        <div class="flex items-center gap-2">
          <Show when={getContentData('Query').result_sets.length > 1}>
            <div class="join">
              <div
                class="join-item tooltip tooltip-primary tooltip-right"
                data-tip={t('console.actions.previous_result_set')}>
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
                data-tip={t('console.actions.next_result_set')}>
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

          <Show when={props.count > 0}>
            <span class="text-sm text-base-content">
              {t('console.table.total_rows')} {props.count}
            </span>
          </Show>
        </div>
        <Show when={resultSet.status === 'Completed' && !resultSet.info}>
          <div class="flex items-center">
            <Show when={props.changesCount > 0}>
              <div class="px-2 gap-4 flex">
                <button class="btn btn-xs btn-outline" onClick={props.resetChanges}>
                  {t('console.actions.reset')}
                </button>
                <button onClick={props.applyChanges} class="btn btn-xs btn-outline btn-error">
                  {t('console.actions.apply')} {props.changesCount}{' '}
                  {t(`console.actions.${props.changesCount > 1 ? 'changes' : 'change'}`)}
                </button>
              </div>
            </Show>
            <Show when={props.hasResults}>
              <button class="btn btn-ghost btn-xs" onClick={(_) => props.onBtnExport('csv')}>
                {t('console.table.csv')}
              </button>
              <button class="btn btn-ghost btn-xs" onClick={(_) => props.onBtnExport('json')}>
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
                class="select select-accent select-bordered select-xs w-full">
                <For each={PAGE_SIZE_OPTIONS}>{(n) => <option value={n}>{n}</option>}</For>
              </select>
            </div>
            <div class="join">
              <div class="tooltip tooltip-primary tooltip-left" data-tip={t('console.actions.previous_page')}>
                <button
                  class="join-item btn btn-xs"
                  disabled={props.loading || !props.page()}
                  onClick={props.onPrevPage}>
                  <ChevronLeft />
                </button>
              </div>
              <button disabled class="join-item btn btn-xs btn-disabled !text-base-content w-[50px]">
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
                  class="join-item btn btn-xs"
                  disabled={props.loading || props.page() * pageSize() + pageSize() >= (resultSet?.count ?? 0)}
                  onClick={props.onNextPage}>
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>
      <Show when={props.table}>
        <form autocomplete="off" onSubmit={submit}>
          <div class="w-full pb-2 bg-base-100 px-2 py-1 grid grid-cols-12 gap-2">
            <div class="col-span-3">
              <select
                onChange={(e) => setFieldValue('column', e.currentTarget.value)}
                class="select select-bordered border-base-content select-sm w-full">
                {props.columns.map((c) => (
                  <option value={c.headerName}>{c.headerName}</option>
                ))}
              </select>
            </div>
            <div class="col-span-1">
              <select
                onChange={(e) => setFieldValue('operator', e.currentTarget.value)}
                class="select select-bordered border-base-content select-sm w-full">
                {Object.keys(COMPARISON_OPERATORS).map((o) => (
                  <option value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div class="col-span-8 flex items-center justify-between gap-3">
              <input
                type="text"
                onChange={(e) => setFieldValue('value', e.currentTarget.value)}
                class="input input-bordered input-sm border-base-content w-full"
                placeholder={t('console.search.placeholder', { table: props.table })}
              />
              <div class="tooltip tooltip-primary tooltip-left" data-tip={t('console.search.clear')}>
                <Switch>
                  <Match when={loading()}>
                    <span class="loading text-primary loading-bars loading-xs"></span>
                  </Match>
                  <Match when={!loading()}>
                    <button class="btn btn-sm btn-ghost" type="button">
                      <CloseIcon />
                    </button>
                  </Match>
                </Switch>
              </div>
            </div>
          </div>
        </form>
      </Show>
    </div>
  );
};
