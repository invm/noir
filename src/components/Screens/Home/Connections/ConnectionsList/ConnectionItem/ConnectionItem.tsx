import { ConnectionConfig, ConnectionModeType, SchemeType } from 'interfaces';
import { firstKey } from 'utils/utils';
import { ColorCircle } from 'components/UI';
import { ActionsMenu } from './ActionsMenu';

export const ConnectionItem = (props: { connection: ConnectionConfig }) => {
  const scheme = firstKey(props.connection.scheme) as SchemeType;
  const mode = firstKey(props.connection.scheme[scheme]!) as ConnectionModeType;
  const creds = props.connection.scheme[scheme]![mode];
  const connectionString = mode === 'Host' ? creds.host : mode === 'File' ? creds.file : creds.sockets_path

  return (
    <div
      class="hover:bg-base-200 rounded-md flex items-center justify-between px-2 py-1">
      <div>
        <div class="flex items-center">
          <h5 class="text-md font-bold">{props.connection.name}</h5>
          <div class="flex px-3">
            <ColorCircle color={props.connection.color} />
          </div>
        </div>
        <p class="text-sm">{connectionString}</p>
      </div>
      <div>
        <ActionsMenu {...{ connection: props.connection! }} />
      </div>
    </div>
  )
}


