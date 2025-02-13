import { useNavigate } from '@solidjs/router';
import { useAppSelector } from 'services/Context';
import { CommandPaletteAction } from 'services/palette/context';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { createEffect, createSignal, on, ParentComponent } from 'solid-js';

const ConnectedConnectionsProvider: ParentComponent = (props) => {
  const {
    connections: { store, selectConnection },
  } = useAppSelector();
  const navigate = useNavigate();
  const [_actions, setActions] = createSignal<CommandPaletteAction[]>([]);
  const connectionsChanged = () => store.connections;

  createEffect(
    on(connectionsChanged, () => {
      setActions([
        ...store.connections.map((conn) => ({
          id: '0-connection-' + conn.id,
          label: `Connect to ${conn.connection.name}`,
          callback: () => {
            // FIXME: this does not cause rerender on the console
            selectConnection(conn.id);
            navigate('/console/' + conn.id);
          },
        })),
      ]);
    })
  );

  return (
    <CommandPaletteContextWrapper actions={[]}>
      {props.children}
    </CommandPaletteContextWrapper>
  );
};

export default ConnectedConnectionsProvider;
