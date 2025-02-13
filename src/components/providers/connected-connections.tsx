import { useNavigate } from '@solidjs/router';
import { useAppSelector } from 'services/Context';
import { ActionGroup } from 'services/palette/context';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { ParentComponent } from 'solid-js';

const ConnectedConnectionsProvider: ParentComponent = (props) => {
  const {
    connections: { store, selectConnection },
  } = useAppSelector();
  const navigate = useNavigate();

  const actions = () =>
    store.connections.map((conn) => ({
      id: '0-connection-' + conn.id,
      label: `Connect to ${conn.connection.name}`,
      callback: () => {
        selectConnection(conn.id);
        navigate('/console/' + conn.id);
      },
    }));

  const actionGroups: ActionGroup[] = [
    {
      id: 'connections',
      label: 'Connections',
      actions: actions(),
    },
  ];

  return (
    <CommandPaletteContextWrapper groups={actionGroups}>
      {props.children}
    </CommandPaletteContextWrapper>
  );
};

export default ConnectedConnectionsProvider;
