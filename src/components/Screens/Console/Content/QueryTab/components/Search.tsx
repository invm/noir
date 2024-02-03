import * as z from 'zod';
import { useAppSelector } from 'services/Context';
import { createEffect, createSignal, Match, Show, Switch } from 'solid-js';
import sql from 'sql-bricks';
import { invoke } from '@tauri-apps/api';
import { QueryTaskEnqueueResult, Row } from 'interfaces';
import { t } from 'utils/i18n';
import { CloseIcon } from 'components/UI/Icons';
import { getAnyCase } from 'utils/utils';
import { createForm } from '@felte/solid';
import { Select, TextInput } from 'components/UI';
import { validator } from '@felte/validator-zod';

export const schema = z.object({
  column: z.string().max(1024),
  operator: z.string().min(1).max(10).default('='),
  value: z.string().max(2048),
});

type Form = z.infer<typeof schema>;

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
  columns: Row[];
};

export const Search = (props: SearchProps) => {
  const {
    connections: { updateContentTab, getConnection },
    messages: { notify },
  } = useAppSelector();

  const [loading, setLoading] = createSignal(false);
  const [cols, setCols] = createSignal<Row[]>([]);

  createEffect(() => {
    if (JSON.stringify(props.columns) !== JSON.stringify(cols())) setCols(props.columns);
  });

  const onSubmit = async (values: Form) => {
    console.log('onSubmit: ', values);
    try {
      setLoading(true);
      const { column, operator, value } = values;
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
      const result_sets = res.map((id) => ({ id, columns: props.columns, table: props.table }));
      updateContentTab('data', { result_sets });
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  const { form, data, reset, setFields } = createForm<Form>({
    onSubmit,
    extend: validator({ schema }),
  });
  form;

  return (
    <Show when={props.table}>
      <form use:form autocomplete="off">
        <div class="w-full pb-2 bg-base-100 px-2 py-1 grid grid-cols-12 gap-2">
          <div class="col-span-3">
            <Select suppressTitlecase name="column" options={cols().map((c) => getAnyCase(c, 'column_name'))} />
          </div>
          <div class="col-span-1">
            <Select name="operator" options={Object.keys(COMPARISON_OPERATORS)} />
          </div>
          <div class="col-span-8 flex items-center justify-between gap-3">
            <TextInput
              name="value"
              placeholder={t('console.search.placeholder', { table: props.table })}
              class="input input-bordered input-sm border-base-content w-full"
            />
            <div class="tooltip tooltip-primary tooltip-left" data-tip={t('console.search.clear')}>
              <Switch>
                <Match when={loading()}>
                  <span class="loading text-primary loading-bars loading-xs"></span>
                </Match>
                <Match when={!loading()}>
                  <button
                    onClick={() => {
                      reset();
                      setFields('column', getAnyCase(cols()[0], 'column_name'));
                      onSubmit(data());
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
