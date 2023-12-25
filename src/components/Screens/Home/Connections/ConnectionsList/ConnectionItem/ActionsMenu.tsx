import { invoke } from '@tauri-apps/api';
import { ConnectionConfig, ConnectionModeType } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { firstKey } from 'utils/utils';

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const {
    messages: { notify },
    connections: { addConnectionTab, fetchSchemaEntities },
  } = useAppSelector();

  const onConnect = async () => {
    const config = props.connection;
    try {
      await invoke('init_connection', { config });
      const type = firstKey(config.scheme[config.dialect]!) as ConnectionModeType;
      const dbName = firstKey(config.scheme[config.dialect]![type]);
      const { triggers, columns, routines, schema } = await fetchSchemaEntities(config.id, config.dialect, dbName);
      await addConnectionTab({
        id: config.id,
        label: config.name,
        selectSchema: dbName,
        schemas: { [dbName]: { columns, schema, routines, triggers } },
        schema,
        connection: config,
        routines,
        triggers,
      });
    } catch (error) {
      notify(String(error));
    }
  };

  return (
    <div class="flex items-center">
      <button onClick={onConnect} class="btn btn-sm btn-ghost">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
          />
        </svg>
      </button>
    </div>
  );
};
