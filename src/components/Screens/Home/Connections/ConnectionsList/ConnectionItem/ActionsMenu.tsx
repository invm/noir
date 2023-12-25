import { invoke } from '@tauri-apps/api';
import { EnterIcon } from 'components/UI/Icons';
import { ConnectionConfig, ConnectionModeType } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { t } from 'utils/i18n';
import { firstKey } from 'utils/utils';

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const {
    messages: { notify },
    connections: { addConnectionTab, fetchSchemaEntities, setLoading },
  } = useAppSelector();

  const onConnect = async () => {
    const config = props.connection;
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex items-center">
      <div class="tooltip tooltip-primary tooltip-left px-3" data-tip={t('connections_list.connect')}>
        <button onClick={onConnect} class="btn btn-sm btn-ghost">
          <EnterIcon />
        </button>
      </div>
    </div>
  );
};
