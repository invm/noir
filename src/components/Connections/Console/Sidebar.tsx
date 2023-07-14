import { createSignal, For, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { DbSchema } from "../../../interfaces"

type Table = {
  name: string
  columns: {
    name: string
    props: Record<string, any>
  }[]
}

const TypeToEmoji = {
  int: '💯',
  char: '🅰️',
  json: '📄',
  decimal: '💰',
  enum: '📚',
  varbinary: '📟',
}

export const Sidebar = (props: { schema: DbSchema }) => {
  const [displayedSchema, setDisplayedSchema] = createSignal('')
  const [tables, setTables] = createStore<Table[]>([])

  onMount(() => {
    const schema = Object.keys(props.schema)[0];
    setDisplayedSchema(schema)
    setTables(transformSchema(schema))
  })

  const transformSchema = (schema: string) => {
    const _tables = Object.entries(props.schema[schema])
      .reduce((acc: any, [name, columns]) => [...acc, {
        name, columns: Object.entries(columns).reduce(
          (cols: any, [name, props]) => [...cols, { name, props }], []
        )
      }], [])
    return _tables
  };

  const select = (schema: string) => {
    setDisplayedSchema(schema)
    setTables(transformSchema(schema))
  }

  const emojiType = (t: string) => {
    const type = t.split('(')[0]
    return TypeToEmoji[type as keyof typeof TypeToEmoji] || '📄'
  }

  return (
    <div class="p-2 bg-base-200 h-full rounded-tr-lg">
      <div class="pb-2 rounded-md">
        <select value={displayedSchema()} onChange={(e) => select(e.currentTarget.value)} class="select select-accent select-bordered select-xs w-full">
          <For each={Object.keys(props.schema)}>
            {(schema) => <option class="py-1" value={schema}>{schema}</option>}
          </For>
        </select>
      </div>
      <div class="text-xs font-bold text-primary">Tables</div>
      <For each={tables}>
        {(table) => (
          <div class="flex items-center">
            <div tabindex="1" class="collapse rounded-sm bg-base-300 mb-1 px-2">
              <div class="collapse rounded-sm text-sm font-small">
                {table.name}
              </div>
              <div class="collapse-content pl-1 pr-0">
                <For each={table.columns}>
                  {(column) => (
                    <div class="flex justify-between items-center">
                      <span class="text-sm"><span class="px-1">{emojiType(column.props.COLUMN_TYPE)}</span>{column.name}</span>
                      <span class="text-xs text-accent">{column.props.COLUMN_TYPE}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
