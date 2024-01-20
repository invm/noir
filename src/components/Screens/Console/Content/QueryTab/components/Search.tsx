import * as z from 'zod';
import { useFormHandler } from 'solid-form-handler';
import { zodSchema } from 'solid-form-handler/zod';
import { useAppSelector } from 'services/Context';
import { createEffect, createSignal, Match, Show, Switch } from 'solid-js';
import sql from 'sql-bricks';
import { invoke } from '@tauri-apps/api';
import { QueryTaskEnqueueResult, Row } from 'interfaces';
import { ColDef } from 'ag-grid-community';
import { t } from 'utils/i18n';
import { CloseIcon } from 'components/UI/Icons';

export const SearchFormSchema = z.object({
  column: z.string().max(1024),
  operator: z.string().min(1).max(1024).default('='),
  value: z.string().max(2048),
});

const wrapper = (operator: (c: string, v: string) => sql.WhereBinary | sql.WhereExpression) => (c: string, v: string) =>
  operator(c, v);

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

type SearchProps = {
  table: string;
  colDef: ColDef[];
  columns: Row[];
};

export const Search = (props: SearchProps) => {
  const {
    connections: { updateContentTab, getConnection },
    messages: { notify },
  } = useAppSelector();

  const [loading, setLoading] = createSignal(false);
  const formHandler = useFormHandler(zodSchema(SearchFormSchema));
  const { formData, setFieldValue } = formHandler;

  createEffect(() => {
    if (props.colDef.length > 0 && !formData().column) {
      setFieldValue('column', props.colDef[0].headerName);
    }
  }, [props.colDef]);

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
      const { column, operator, value } = formData();
      const op = COMPARISON_OPERATORS[operator as keyof typeof COMPARISON_OPERATORS].operator;
      const where = op(column, value);
      let query = sql.select().from(props.table);
      if (value) query = query.where(where);
      const conn = getConnection();
      const { result_sets: res } = await invoke<QueryTaskEnqueueResult>('enqueue_query', {
        connId: conn.id,
        sql: query.toString(),
        autoLimit: true,
        tabIdx: conn.idx,
        table: props.table,
      });
      const result_sets = res.map((id) => ({ id, columns: props.columns }));
      updateContentTab('data', { result_sets });
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show when={props.table}>
      <form autocomplete="off" onSubmit={submit}>
        <div class="w-full pb-2 bg-base-100 px-2 py-1 grid grid-cols-12 gap-2">
          <div class="col-span-3">
            <select
              onChange={(e) => setFieldValue('column', e.currentTarget.value)}
              class="select select-bordered border-base-content select-sm w-full">
              {props.colDef.map((c) => (
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
              value={formData().value}
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
                  <button
                    onClick={(e) => {
                      setFieldValue('value', '');
                      submit(e);
                    }}
                    class="btn btn-sm btn-ghost"
                    type="button">
                    <CloseIcon />
                  </button>
                </Match>
              </Switch>
            </div>
          </div>
        </div>
      </form>
    </Show>
  );
};
