import { invoke } from '@tauri-apps/api';
import { ConnectionConfig, QueryResult } from 'interfaces';
import { useAppSelector } from 'services/Context';

const columnsToSchema = (columns: Record<string, any>[]) => {
  const schema = columns.reduce((acc: any, col: any) => {
    return {
      ...acc,
      [col.TABLE_SCHEMA]: {
        ...acc[col.TABLE_SCHEMA],
        [col.TABLE_NAME]: {
          ...acc[col.TABLE_SCHEMA]?.[col.TABLE_NAME],
          [col.COLUMN_NAME]: col
        }
      }
    }
  }, {})
  return schema
}

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const { errorService: { addError }, connectionsService: { addTab } } = useAppSelector()

  const onConnect = async () => {
    try {
      await invoke('init_connection', { config: props.connection })
      const { result } = await invoke<QueryResult>('get_columns', { connId: props.connection.id });
      const schema = columnsToSchema(result)
      await addTab({
        id: props.connection.id,
        label: props.connection.name,
        schema,
        connection: props.connection,
      })
    } catch (error) {
      addError(String(error))
    }
  }

  return (
    <div class="flex items-center">
      <button onClick={onConnect} class="btn btn-sm btn-ghost">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
        </svg>
      </button>
    </div >
  )
}

