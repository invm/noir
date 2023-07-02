import { ConnectionConfig, ConnectionModeType, SchemeType } from '../../../../interfaces';
import { firstKey } from '../../../../utils/utils';
import { ColorCircle } from '../../../UI';
import { ActionsMenu } from './ActionsMenu';

export const ConnectionItem = (props: { connection: ConnectionConfig, deleteConnection: (id: string) => Promise<void> }) => {
  const scheme = firstKey(props.connection.scheme) as SchemeType;
  const mode = firstKey(props.connection.scheme[scheme]!) as ConnectionModeType;
  const creds = props.connection.scheme[scheme]![mode];
  const connectionString = mode === 'Host' ? creds.host : mode === 'File' ? creds.file : creds.sockets_path

  const deleteConnection = async () => {
    await props.deleteConnection(props.connection.id!);
  }

  return (
    <div
      class="group hover:bg-gray-800 rounded-md flex items-center justify-between px-2 py-1">
      <div>
        <div class="flex items-center">
          <h5 class="text text-md font-bold">{props.connection.name}</h5>
          <div class="flex px-3">
            <ColorCircle color={props.connection.color} />
          </div>
        </div>
        <p class="text text-sm dark:text-slate-500">{connectionString}</p>
      </div>
      <div class="hidden group-hover:block">
        <ActionsMenu {...{ deleteConnection, connection: props.connection! }} />
      </div>
    </div>
  )
}


