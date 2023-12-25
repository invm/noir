import { invoke } from '@tauri-apps/api';
import { ConnectionConfig, RawQueryResult } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { columnsToSchema } from 'utils/utils';

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const {
    messages: { notify },
    connections: { addConnectionTab },
  } = useAppSelector();

  const onConnect = async () => {
    const config = props.connection;
    try {
      await invoke('init_connection', { config });
      const { result } = await invoke<RawQueryResult>('get_columns', {
        connId: config.id,
      });
      const schema = columnsToSchema(result, config.dialect);
      const { result: routines } = await invoke<RawQueryResult>('get_procedures', {
        connId: config.id,
      });

      const { result: triggers } = await invoke<RawQueryResult>('get_triggers', {
        connId: config.id,
      });
      await addConnectionTab({
        id: config.id,
        label: config.name,
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
