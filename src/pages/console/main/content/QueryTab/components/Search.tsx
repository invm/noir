import * as z from 'zod';
import { useAppSelector } from 'services/Context';
import { VsChromeClose as Close } from 'solid-icons/vs';
import { createEffect, createSignal, Match, Show, Switch } from 'solid-js';
import sql from 'sql-bricks';
import { invoke } from '@tauri-apps/api/core';
import { QueryTaskEnqueueResult, Row } from 'interfaces';
import { t } from 'utils/i18n';
import { getAnyCase } from 'utils/utils';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { TextField, TextFieldRoot } from 'components/ui/textfield';
import { Button } from 'components/ui/button';
import { Loader } from 'components/ui/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { toast } from 'solid-sonner';

export const schema = z.object({
  column: z.string().max(1024),
  operator: z.string().min(1).max(10).default('='),
  value: z.string().max(2048),
});

type Form = z.infer<typeof schema>;

const wrapper =
  (operator: (c: string, v: string) => sql.WhereBinary | sql.WhereExpression) =>
  (c: string, v: string) =>
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
    connections: { updateDataContentTab, getConnection },
  } = useAppSelector();

  const [loading, setLoading] = createSignal(false);
  const [cols, setCols] = createSignal<Row[]>([]);

  createEffect(() => {
    if (JSON.stringify(props.columns) !== JSON.stringify(cols()))
      setCols(props.columns);
  });

  const onSubmit = async (values: Form) => {
    try {
      setLoading(true);
      const { column, operator, value } = values;
      const op =
        COMPARISON_OPERATORS[operator as keyof typeof COMPARISON_OPERATORS]
          .operator;
      const where = op(column, value);
      let query = sql.select().from(props.table);
      if (value) query = query.where(where);
      const conn = getConnection();
      const { result_sets: res } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: conn.id,
          sql: query.toString(),
          autoLimit: true,
          tabIdx: conn.idx,
          table: props.table,
        }
      );
      const result_sets = res.map((id) => ({
        id,
        loading: true,
        columns: props.columns,
        table: props.table,
      }));
      updateDataContentTab('result_sets', result_sets);
    } catch (error) {
      toast.error('Could not enqueue query', {
        description: (error as Error).message || (error as string),
      });
    } finally {
      setLoading(false);
    }
  };

  const { form, data, reset, setFields } = createForm<Form>({
    onSubmit,
    extend: validator({ schema }),
  });
  form;

  createEffect(() => {
    if (cols().length) {
      setFields('column', getAnyCase(cols()[0], 'column_name'));
      setFields('operator', '=');
    }
  });

  return (
    <Show when={props.table}>
      {/* @ts-ignore */}
      <form use:form autocomplete="off">
        <div class="w-full pb-2 px-2 grid grid-cols-12 gap-2 grid-rows-1">
          <div class="col-span-3">
            <Select
              name="column"
              value={data('column')}
              options={cols().map((c) => getAnyCase(c, 'column_name'))}
              onChange={(value) => {
                setFields('column', value || '');
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
              <SelectContent />
            </Select>
          </div>
          <div class="col-span-1">
            <Select
              class="w-full"
              name="operator"
              value={data('operator')}
              onChange={(value) => {
                setFields('operator', value || '=');
              }}
              options={Object.keys(COMPARISON_OPERATORS)}
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8 w-full">
                <SelectValue>
                  {(state) => state.selectedOption() as string}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          <div class="col-span-8 flex items-center justify-between gap-2">
            <TextFieldRoot class="w-full">
              <TextField
                placeholder={t('console.search.placeholder', {
                  table: props.table,
                })}
                name="value"
                size="sm"
                class="h-8 w-full"
              />
            </TextFieldRoot>
            <Switch>
              <Match when={loading()}>
                <Loader />
              </Match>
              <Match when={!loading()}>
                <Tooltip>
                  <TooltipTrigger
                    size="icon"
                    variant="ghost"
                    class="h-8"
                    onClick={() => {
                      reset();
                      setFields('column', getAnyCase(cols()[0], 'column_name'));
                      onSubmit(data());
                    }}
                    as={Button}
                  >
                    <Close />
                  </TooltipTrigger>
                  <TooltipContent>{t('console.search.clear')}</TooltipContent>
                </Tooltip>
              </Match>
            </Switch>
          </div>
        </div>
      </form>
    </Show>
  );
};
