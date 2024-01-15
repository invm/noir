import { ConnectionConfig, Mode } from 'interfaces';
import { ColorCircle } from 'components/UI';
import { useAppSelector } from 'services/Context';
import { invoke } from '@tauri-apps/api';

export const ConnectionItem = (props: { connection: ConnectionConfig }) => {
  const mode = props.connection.mode;
  const creds = props.connection.credentials;
  const connectionString = mode === Mode.Host ? creds.host : mode === Mode.File ? creds.file : creds.socket;

  const {
    messages: { notify },
    connections: { addConnectionTab, fetchSchemaEntities, setLoading },
  } = useAppSelector();

  const onConnect = async () => {
    const config = props.connection;
    setLoading(true);
    try {
      await invoke('init_connection', { config });
      const { triggers, columns, routines, tables, schemas, views } = await fetchSchemaEntities(
        config.id,
        config.dialect
      );
      await addConnectionTab({
        id: config.id,
        label: config.name,
        selectedSchema: config.schema,
        definition: { [config.schema]: { columns, routines, triggers, tables, views } },
        schemas,
        connection: config,
      });
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onConnect} class="hover:bg-base-100 cursor-pointer rounded-md flex items-center justify-between px-2 py-1">
      <div>
        <div class="flex items-center">
          <div class="flex pr-3">
            <ColorCircle color={props.connection.color} />
          </div>
          <h5 class="text-md font-bold">{props.connection.name}</h5>
        </div>
        <p class="text-sm">{connectionString}</p>
      </div>
    </div>
  );
};
