import { useAppSelector } from 'services/Context';
import { VsChromeClose as Close } from 'solid-icons/vs';
import { IoCopyOutline as CopyIcon } from 'solid-icons/io';
import { FiPlus as Plus } from 'solid-icons/fi';
import { FiMinus as Minus } from 'solid-icons/fi';
import { createEffect, createSignal, For, Match, Show, Switch } from 'solid-js';
import sql from 'sql-bricks';
import { invoke } from '@tauri-apps/api/core';
import { QueryTaskEnqueueResult, Row } from 'interfaces';
import { t } from 'utils/i18n';
import { getAnyCase } from 'utils/utils';
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
import { createStore } from 'solid-js/store';

const wrapper =
  (operator: (c: string, v: string) => sql.WhereBinary | sql.WhereExpression) =>
  (c: string, v: string) =>
    operator(c, v);

const COMPARISON_OPERATORS = {
  '=': { label: 'Equals', operator: wrapper(sql.eq) },
  '!=': { label: 'Not Equals', operator: wrapper(sql.notEq) },
  '>': { label: 'Greater Than', operator: wrapper(sql.gt) },
  '<': { label: 'Less Than', operator: wrapper(sql.lt) },
  '>=': { label: 'Greater Than or Equals', operator: wrapper(sql.gte) },
  '<=': { label: 'Less Than or Equals', operator: wrapper(sql.lte) },
  LIKE: { label: 'Like', operator: wrapper(sql.like) },
  'NOT LIKE': { label: 'Not Like', operator: (c: string, v: string) => sql.not(sql.like(c, v)) },
  IN: { label: 'In', operator: wrapper(sql.in) },
  'NOT IN': { label: 'Not In', operator: (c: string, v: string) => sql.not(sql.in(c, v)) },
};

type FilterRow = {
  column: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
};

type SearchProps = {
  table: string;
  columns: Row[];
};

const defaultRow = (column: string): FilterRow => ({
  column,
  operator: '=',
  value: '',
  logic: 'AND',
});

export const Search = (props: SearchProps) => {
  const {
    connections: { updateDataContentTab, getConnection },
  } = useAppSelector();

  const [loading, setLoading] = createSignal(false);
  const [cols, setCols] = createSignal<Row[]>([]);
  const [filters, setFilters] = createStore<FilterRow[]>([]);

  createEffect(() => {
    if (JSON.stringify(props.columns) !== JSON.stringify(cols())) {
      setCols(props.columns);
    }
  });

  createEffect(() => {
    if (cols().length && filters.length === 0) {
      setFilters([defaultRow(getAnyCase(cols()[0], 'column_name'))]);
    }
  });

  const buildQuery = () => {
    let query = sql.select().from(props.table);
    const activeFilters = filters.filter((f) => f.value);
    if (activeFilters.length === 0) return query;

    const conditions = activeFilters.map((f) => {
      const op = COMPARISON_OPERATORS[f.operator as keyof typeof COMPARISON_OPERATORS].operator;
      return op(f.column, f.value);
    });

    // Check if all logics are the same
    const allOr = activeFilters.every((f) => f.logic === 'OR');

    if (allOr && conditions.length > 1) {
      query = query.where(sql.or(...conditions));
    } else if (conditions.length > 1) {
      // Mixed or all AND — group OR conditions together
      let combined: (sql.WhereBinary | sql.WhereExpression)[] = [];
      let orGroup: (sql.WhereBinary | sql.WhereExpression)[] = [];

      for (let i = 0; i < conditions.length; i++) {
        if (i > 0 && activeFilters[i].logic === 'OR') {
          orGroup.push(conditions[i]);
        } else {
          if (orGroup.length > 0) {
            combined.push(sql.or(...orGroup));
            orGroup = [];
          }
          orGroup.push(conditions[i]);
        }
      }
      if (orGroup.length > 1) {
        combined.push(sql.or(...orGroup));
      } else if (orGroup.length === 1) {
        combined.push(orGroup[0]);
      }

      query = query.where(sql.and(...combined));
    } else if (conditions.length === 1) {
      query = query.where(conditions[0]);
    }

    return query;
  };

  const onSubmit = async (e?: Event) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const query = buildQuery();
      const queryStr = query.toString();
      const conn = getConnection();
      const { result_sets: res } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: conn.id,
          sql: queryStr,
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

  const addFilter = () => {
    if (!cols().length) return;
    setFilters([...filters, defaultRow(getAnyCase(cols()[0], 'column_name'))]);
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setFilters([defaultRow(getAnyCase(cols()[0], 'column_name'))]);
    onSubmit();
  };

  const copySQL = () => {
    const queryStr = buildQuery().toString();
    navigator.clipboard.writeText(queryStr);
    toast.success('SQL copied to clipboard');
  };

  return (
    <Show when={props.table}>
      <form onSubmit={onSubmit} autocomplete="off">
        <div class="w-full pb-2 px-2 flex flex-col gap-1">
          <For each={filters}>
            {(filter, idx) => (
              <div class="grid grid-cols-12 gap-2 items-center">
                {/* Logic toggle (AND/OR) for rows after the first */}
                <div class="col-span-1 flex justify-center">
                  <Show when={idx() > 0} fallback={<span class="text-xs text-muted-foreground">Where</span>}>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 text-xs px-1"
                      onClick={() => {
                        setFilters(idx(), 'logic', filter.logic === 'AND' ? 'OR' : 'AND');
                      }}
                    >
                      {filter.logic}
                    </Button>
                  </Show>
                </div>
                <div class="col-span-3">
                  <Select
                    value={filter.column}
                    options={cols().map((c) => getAnyCase(c, 'column_name'))}
                    onChange={(value) => setFilters(idx(), 'column', value || '')}
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
                    value={filter.operator}
                    onChange={(value) => setFilters(idx(), 'operator', value || '=')}
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
                <div class="col-span-6">
                  <TextFieldRoot class="w-full">
                    <TextField
                      placeholder={t('console.search.placeholder', { table: props.table })}
                      value={filter.value}
                      onInput={(e: InputEvent) =>
                        setFilters(idx(), 'value', (e.target as HTMLInputElement).value)
                      }
                      size="sm"
                      class="h-8 w-full"
                    />
                  </TextFieldRoot>
                </div>
                <div class="col-span-1 flex items-center gap-1">
                  <Show when={filters.length > 1}>
                    <Tooltip>
                      <TooltipTrigger
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7"
                        onClick={() => removeFilter(idx())}
                        as={Button}
                      >
                        <Minus class="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>Remove condition</TooltipContent>
                    </Tooltip>
                  </Show>
                </div>
              </div>
            )}
          </For>
          <div class="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                size="sm"
                variant="ghost"
                class="h-7 text-xs"
                onClick={addFilter}
                as={Button}
              >
                <Plus class="size-3 mr-1" />
                Add condition
              </TooltipTrigger>
              <TooltipContent>Add filter condition</TooltipContent>
            </Tooltip>
            <Button size="sm" variant="default" class="h-7 text-xs" type="submit">
              Apply
            </Button>
            <Tooltip>
              <TooltipTrigger
                size="icon"
                variant="ghost"
                class="h-7 w-7"
                onClick={copySQL}
                as={Button}
              >
                <CopyIcon class="size-3" />
              </TooltipTrigger>
              <TooltipContent>Copy SQL</TooltipContent>
            </Tooltip>
            <Switch>
              <Match when={loading()}>
                <Loader />
              </Match>
              <Match when={!loading()}>
                <Tooltip>
                  <TooltipTrigger
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7"
                    onClick={clearAll}
                    as={Button}
                  >
                    <Close class="size-3" />
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
