import { TableColumnsCollapse } from "./TableColumnsCollapse";
import { useAppSelector } from "services/Context";
import { createSignal, For, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { t } from "utils/i18n";

type Table = {
  name: string;
  columns: {
    name: string;
    props: Record<string, any>;
  }[];
};

export const Sidebar = () => {
  const {
    connectionsService: { getActiveConnection },
  } = useAppSelector();
  const getSchema = () => getActiveConnection()?.schema ?? {};
  const [displayedSchema, setDisplayedSchema] = createSignal("");
  const [tables, setTables] = createStore<Table[]>([]);

  onMount(() => {
    const _schema = Object.keys(getSchema())[0];
    setDisplayedSchema(_schema);
    setTables(transformSchema(_schema));
  });

  const transformSchema = (sch: string) => {
    const _tables = Object.entries(getSchema()[sch]).reduce(
      (acc: any, [name, columns]) => [
        ...acc,
        {
          name,
          columns: Object.entries(columns).reduce(
            (cols: any, [name, props]) => [...cols, { name, props }],
            []
          ),
        },
      ],
      []
    );
    return _tables;
  };

  const select = (_schema: string) => {
    setDisplayedSchema(_schema);
    setTables(transformSchema(_schema));
  };

  return (
    <div class="p-2 bg-base-300 h-full rounded-tr-lg">
      <div class="pb-2 rounded-md">
        <label for="schema" class="text-xs font-bold py-1 text-primary">
          {t("components.sidebar.schema")}
        </label>
        <select
          id="schema"
          value={displayedSchema()}
          onChange={(e) => select(e.currentTarget.value)}
          class="select select-accent select-bordered select-xs w-full"
        >
          <For each={Object.keys(getSchema())}>
            {(_schema) => (
              <option class="py-1" value={_schema}>
                {_schema}
              </option>
            )}
          </For>
        </select>
      </div>
      <div class="overflow-y-auto h-full">
        <div class="text-xs font-bold py-1 text-primary">
          {t("components.sidebar.tables")}
        </div>
        <For each={tables}>
          {(table) => (
            <div class="mb-1 pl-1 min-w-full w-fit">
              <TableColumnsCollapse title={table.name}>
                <For each={table.columns}>
                  {(column) => (
                    <div class="flex w-full justify-between items-center w-full border-b-2 border-base-300">
                      <span class="text-xs">
                        <span class="px-1"></span>
                        {column.name}
                      </span>
                      <span class="text-xs text-neutral-focus font-medium ml-2">
                        {column.props.COLUMN_TYPE}
                      </span>
                    </div>
                  )}
                </For>
              </TableColumnsCollapse>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
