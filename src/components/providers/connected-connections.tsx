import { useNavigate } from '@solidjs/router';
import { Kbd } from 'components/ui/kbd';
import { useAppSelector } from 'services/Context';
import { Action } from 'services/palette/context';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { createEffect, createSignal, on, ParentComponent } from 'solid-js';

const ConnectedConnectionsProvider: ParentComponent = (props) => {
  const {
    connections: { store, selectConnection },
  } = useAppSelector();
  const navigate = useNavigate();
  const [actions, setActions] = createSignal<Action[]>([]);
  const connectionsChanged = () => store.connections;

  createEffect(
    on(connectionsChanged, () => {
      setActions([
        ...store.connections.map((conn, idx) => ({
          id: '0-connection-' + conn.id,
          label: `Connect to ${conn.connection.name}`,
          shortcut: <Kbd shift key={idx + 1} />,
          callback: () => {
            selectConnection(conn.id);
            navigate('/console/' + conn.id);
          },
        })),
      ]);
    })
  );

  return (
    <CommandPaletteContextWrapper actions={actions()}>
      {props.children}
    </CommandPaletteContextWrapper>
  );
};

export default ConnectedConnectionsProvider;
