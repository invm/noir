import { createStore, produce } from 'solid-js/store';
import { Column, ConnectionConfig, ResultSet, Row, Table, TableEntity } from '../interfaces';
import { Store } from 'tauri-plugin-store-api';
import { debounce, firstKey } from 'utils/utils';
import { invoke } from '@tauri-apps/api';
import { MessageService } from './Messages';
import { createSignal } from 'solid-js';

const store = new Store('.connections.dat');
const INTERVAL = 1000;

export const MessageType = {
  error: 'error',
  info: 'info',
  success: 'success',
  warning: 'warning',
} as const;

export const ContentTab = {
  Query: 'Query',
  TableStructure: 'TableStructure',
} as const;

type ContentComponentKeys = keyof typeof ContentTab;

type ContentTabData = {
  [ContentTab.Query]: QueryContentTabData;
  [ContentTab.TableStructure]: TableStructureContentTabData;
};

export const newContentTab = <T extends ContentComponentKeys>(label: string, key: T, data?: ContentTabData[T]) => {
  switch (key) {
    case ContentTab.Query:
      return {
        label,
        data: data ?? { query: '', result_sets: [] },
        key,
      };
    case ContentTab.TableStructure:
      return {
        label,
        data: data ?? {
          table: label,
          columns: [],
          indices: [],
          constraints: [],
          triggers: [],
        },
        key,
      };
    default:
      throw new Error('Invalid content tab key');
  }
};

export type QueryContentTabData = {
  query: string;
  cursor: number;
  result_sets: ResultSet[];
};

export type TableStructureContentTabData = {
  table: string;
  [TableEntity.columns]: Row[];
  [TableEntity.indices]: Row[];
  [TableEntity.triggers]: Row[];
  [TableEntity.constraints]: Row[];
};

export type ContentTab = {
  label: string;
  error?: string;
} & (
    | {
      key: typeof ContentTab.Query;
      data: Partial<QueryContentTabData>;
    }
    | {
      key: typeof ContentTab.TableStructure;
      data: Partial<TableStructureContentTabData>;
    }
  );

type ConnectionTab = {
  label: string;
  id: string;
  schema: Record<string, Table>;
  connection: ConnectionConfig;
};

const CONNECTIONS_KEY = '_conn_tabs';
const CONTENT_KEY = '_content_tabs';

type StoreSavedData = {
  [CONNECTIONS_KEY]: ConnectionStore;
  [CONTENT_KEY]: ContentStore;
};

const getSavedData = async <T extends keyof StoreSavedData>(key: T) => {
  const str = await store.get(key);
  if (!str) return {} as StoreSavedData[T];
  try {
    const res = JSON.parse(str as string);
    return res as StoreSavedData[T];
  } catch (e) {
    return {} as StoreSavedData[T];
  }
};

type ConnectionStore = {
  tabs: ConnectionTab[];
  idx: number;
  schema: string;
};

type ContentStore = {
  tabs: ContentTab[];
  idx: number;
};

export const ConnectionsService = () => {
  const [connectionStore, setConnectionStore] = createStore<ConnectionStore>({
    tabs: [],
    idx: 0,
    schema: '',
  });

  const [contentStore, setContentStore] = createStore<ContentStore>({
    tabs: [],
    idx: 0,
  });
  const [queryIdx, setQueryIdx] = createSignal<number>(0);

  const restoreConnectionStore = async () => {
    const conn_tabs: ConnectionStore = await getSavedData(CONNECTIONS_KEY);
    if (!conn_tabs.tabs) return;
    const tabs = await conn_tabs.tabs.reduce(
      async (acc, conn) => {
        const res = await acc;
        try {
          await invoke('init_connection', { config: conn.connection });
          return Promise.resolve([...res, conn]);
        } catch (e) {
          conn_tabs.idx = 0;
          MessageService().notify(e);
          return Promise.resolve(res);
        }
      },
      Promise.resolve([] as ConnectionTab[])
    );
    if (tabs.length) {
      setConnectionStore(() => ({ ...conn_tabs, tabs }));
      const content = await getSavedData(CONTENT_KEY);
      setContentStore(() => content as ContentStore);
    }
    updateStore();
  };

  const updateStore = debounce(async () => {
    await store.set(CONNECTIONS_KEY, JSON.stringify(connectionStore));
    const tabs = contentStore.tabs.map((t) =>
      t.key === ContentTab.Query ? { ...t, data: { ...t.data, result_sets: [] } } : t
    );
    await store.set(CONTENT_KEY, JSON.stringify({ idx: contentStore.idx, tabs }));
    await store.save();
  }, INTERVAL);

  const addConnectionTab = async (tab: ConnectionTab) => {
    if (connectionStore.tabs.find((t) => t.id === tab.id)) return;
    setContentStore('tabs', [newContentTab('Query', ContentTab.Query)]);
    setConnectionStore(
      produce((s) => {
        s.tabs.push(tab);
        s.idx = s.tabs.length;
        s.schema = firstKey(tab.schema)!;
      })
    );
    updateStore();
  };

  const removeConnectionTab = async (id: string) => {
    setConnectionStore('idx', 0);
    setConnectionStore(
      'tabs',
      connectionStore.tabs.filter((t) => t.id !== id)
    );
    updateStore();
  };

  const clearStore = async () => {
    await store.clear();
  };

  const getConnection = () => {
    return connectionStore.tabs[connectionStore.idx - 1];
  };

  const getSchema = (schema: string) => {
    return (getConnection() && getConnection().schema[schema]) ?? {};
  };

  const getContent = () => contentStore.tabs[contentStore.idx];

  const getContentData = <T extends keyof ContentTabData>(_key: T) => {
    return contentStore.tabs[contentStore.idx].data as ContentTabData[T];
  };

  const addContentTab = (tab?: ContentTab) => {
    setContentStore(
      produce((s) => {
        s.tabs.push(tab ?? newContentTab('Query', ContentTab.Query));
        s.idx = s.tabs.length - 1;
      })
    );
    updateStore();
  };

  const removeContentTab = (idx?: number) => {
    if (contentStore.tabs.length === 1) return;
    setContentStore(
      produce((s) => {
        s.tabs.splice(idx ?? s.idx, 1);
        s.idx = s.tabs.length - 1;
      })
    );
    updateStore();
  };

  const setConnectionIdx = (i: number) => {
    if (i <= connectionStore.tabs.length) {
      setConnectionStore('idx', i);
    }
  };

  const setContentIdx = (i: number) => {
    if (i < contentStore.tabs.length) {
      setContentStore('idx', i);
      setQueryIdx(0);
    }
  };

  const updateConnectionTab = <T extends keyof ConnectionTab>(key: T, data: ConnectionTab[T], idx?: number) => {
    const tab = getConnection();
    if (!tab) return;
    setConnectionStore('tabs', idx ?? connectionStore.idx - 1, key, data);
    updateStore();
  };

  const updateContentTab = <T extends keyof ContentTab>(key: T, data: ContentTab[T], idx?: number) => {
    const tab = getContent();
    if (!tab) return;
    setContentStore('tabs', idx ?? contentStore.idx, key, data);
    updateStore();
  };

  const insertColumnName = (column: string) => {
    const { query, cursor } = getContentData('Query');
    const _query = query.slice(0, cursor) + column + ', ' + query.slice(cursor);
    setContentStore('tabs', contentStore.idx, 'data', { query: _query, cursor: cursor + column.length + 2 }); // 2 for ', '
  };

  const updateResultSet = (tab_idx: number, query_idx: number, data: Partial<ResultSet>) => {
    setContentStore('tabs', tab_idx, 'data', (d) => ({
      ...d,
      result_sets: (d as QueryContentTabData).result_sets.map((r, i) => (i === query_idx ? { ...r, ...data } : r)),
    }));
  };

  const getSchemaTables = (sch = connectionStore.schema): Table[] => {
    const _tables = Object.entries(getSchema(sch)).reduce(
      (acc: Table[], [name, columns]) => [
        ...acc,
        {
          name,
          columns: Object.entries(columns).reduce((cols: Column[], [name, props]) => [...cols, { name, props }], []),
        },
      ],
      []
    );
    return _tables;
  };

  const selectPrevQuery = () => {
    // TODO: fix this
    if (getContentData('Query').result_sets.length)
      setQueryIdx((s) => (s - 1) % getContentData('Query').result_sets.length);
  };

  const selectNextQuery = () => {
    if (getContentData('Query').result_sets.length)
      setQueryIdx((s) => (s + 1) % getContentData('Query').result_sets.length);
  };

  return {
    connectionStore,
    setConnectionStore,
    contentStore,
    setContentStore,
    addConnectionTab,
    removeConnectionTab,
    clearStore,
    getConnection,
    getContent,
    getContentData,
    updateStore,
    setConnectionIdx,
    restoreConnectionStore,
    setContentIdx,
    addContentTab,
    updateContentTab,
    removeContentTab,
    updateConnectionTab,
    getSchemaTables,
    selectPrevQuery,
    selectNextQuery,
    queryIdx,
    updateResultSet,
    getSchema,
    insertColumnName,
  };
};
