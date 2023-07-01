import { A } from '@solidjs/router';
import { ConnectionConfig, ConnectionModeType, SchemeType } from '../../interfaces';
import { firstKey } from '../../utils/utils';

export const ConnectionItem = (props: { connection: ConnectionConfig }) => {
  const scheme = firstKey(props.connection.scheme) as SchemeType;
  const mode = firstKey(props.connection.scheme[scheme]) as ConnectionModeType;
  const creds = props.connection.scheme[scheme][mode];
  const connectionString = mode === 'Host' ? creds.host : mode === 'File' ? creds.file : creds.sockets_path
  return (
    <div onDblClick={() => { console.log('db clicked') }} onClick={() => console.log('clicked: ', props.connection.id)} class="cursor-pointer hover:bg-gray-800 rounded-md flex items-center justify-between px-2 py-1">
      <div>
        <h5 class="text text-md font-bold">{props.connection.name}</h5>
        <p class="text text-sm dark:text-slate-500">{connectionString}</p>
      </div>
    </div>
  )
}

