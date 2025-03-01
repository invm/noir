import { Match, Switch } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { QueryTab } from './QueryTab/QueryTab';
import { TableStructureTab } from './TableStructureTab';
import { ContentTab } from 'services/Connections';
import { DataTab } from './DataTab';

export const Content = () => {
  const {
    connections: { getConnection, getContent },
  } = useAppSelector();

  const key = () => getContent().key;

  return (
    <Switch>
      <Match when={key() === ContentTab.Query}>
        <QueryTab />
      </Match>
      <Match when={key() === ContentTab.TableStructure}>
        <TableStructureTab tabIdx={getConnection().idx} />
      </Match>
      <Match when={key() === ContentTab.Data}>
        <DataTab />
      </Match>
    </Switch>
  );
};
