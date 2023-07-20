import { Collapse } from "components/UI"
import { useAppSelector } from "services/Context"
import { createSignal, For, onMount } from "solid-js"
import { createStore } from "solid-js/store"

type Table = {
  name: string
  columns: {
    name: string
    props: Record<string, any>
  }[]
}

// TODO: change to icons
const TypeToEmoji = {
  int: '#',
  char: 'C',
  json: 'J',
  decimal: '%',
  enum: '@',
  varbinary: '*',
  datetime: 'D',
  tinyint: 'T',
  bigint: 'B',
  varchar: 'V',
  text: 'T',
}

export const Sidebar = () => {
  const { connectionsService: { getActiveConnection } } = useAppSelector()
  const getSchema = () => getActiveConnection()?.schema ?? {}
  const [displayedSchema, setDisplayedSchema] = createSignal('')
  const [tables, setTables] = createStore<Table[]>([])

  onMount(() => {
    const _schema = Object.keys(getSchema())[0];
    setDisplayedSchema(_schema)
    setTables(transformSchema(_schema))
  })

  const transformSchema = (sch: string) => {
    const _tables = Object.entries(getSchema()[sch])
      .reduce((acc: any, [name, columns]) => [...acc, {
        name, columns: Object.entries(columns).reduce(
          (cols: any, [name, props]) => [...cols, { name, props }], []
        )
      }], [])
    return _tables
  };

  const select = (_schema: string) => {
    setDisplayedSchema(_schema)
    setTables(transformSchema(_schema))
  }

  const emojiType = (t: string) => {
    const type = t.split('(')[0]
    return TypeToEmoji[type as keyof typeof TypeToEmoji] || ''
  }

  return (
    <div class="p-2 bg-base-200 h-full rounded-tr-lg overflow-y-scroll">
      <div class="pb-2 rounded-md">
        <select value={displayedSchema()} onChange={(e) => select(e.currentTarget.value)} class="select select-accent select-bordered select-xs w-full">
          <For each={Object.keys(getSchema())}>
            {(_schema) => <option class="py-1" value={_schema}>{_schema}</option>}
          </For>
        </select>
      </div>
      <div class="text-xs font-bold text-primary">Tables</div>
      <For each={tables}>
        {(table) => (
          <div class="rounded-sm bg-base-300 mb-1 px-2">
            <Collapse title={table.name}>
              <div class="overflow-x-scroll w-full">
                <For each={table.columns}>
                  {(column) => (
                    <div class="flex justify-between items-center w-full">
                      <span class="text-sm mr-2"><span class="px-1">{emojiType(column.props.COLUMN_TYPE)}</span>{column.name}</span>
                      <span class="text-xs text-accent ml-2">{column.props.COLUMN_TYPE}</span>
                    </div>
                  )}
                </For>
              </div>
            </Collapse>
          </div>
        )}
      </For>
    </div>
  )
}
