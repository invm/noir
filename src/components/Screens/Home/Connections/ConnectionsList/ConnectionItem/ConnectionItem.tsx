import { ConnectionConfig, Mode } from 'interfaces';
import { ColorCircle } from 'components/UI';
import { ActionsMenu } from './ActionsMenu';

export const ConnectionItem = (props: { connection: ConnectionConfig }) => {
  const mode = props.connection.mode;
  const creds = props.connection.credentials;
  const connectionString = mode === Mode.Host ? creds.host : mode === Mode.File ? creds.file : creds.socket;

  return (
    <div class="hover:bg-base-200 rounded-md flex items-center justify-between px-2 py-1">
      <div>
        <div class="flex items-center">
          <div class="flex pr-3">
            <ColorCircle color={props.connection.color} />
          </div>
          <h5 class="text-md font-bold">{props.connection.name}</h5>
        </div>
        <p class="text-sm">{connectionString}</p>
      </div>
      <div>
        <ActionsMenu connection={props.connection} />
      </div>
    </div>
  );
};
