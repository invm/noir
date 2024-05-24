import { createStore, produce } from 'solid-js/store';
import {
  ConnectionConfig,
  Credentials,
  DialectType,
  ModeType,
  RawQueryResult,
  ResultSet,
  Row,
  Table,
  TableEntity,
} from '../interfaces';
import { Store } from 'tauri-plugin-store-api';
import { columnsToTables, debounce } from 'utils/utils';
import { invoke } from '@tauri-apps/api';
import { createSignal } from 'solid-js';

const cache = new Store('.connections.dat');
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
  Data: 'Data',
} as const;

type ContentComponentKeys = keyof typeof ContentTab;

export type ContentTabData = {
  [ContentTab.Query]: QueryContentTabData;
  [ContentTab.TableStructure]: TableStructureContentTabData;
  [ContentTab.Data]: DataContentTabData;
};

export const newContentTab = <T extends ContentComponentKeys>(
  label: string,
  key: T,
  data?: ContentTabData[T]
) => {
  switch (key) {
    case ContentTab.Query:
      return {
        label,
        data: data ?? { query: '', result_sets: [] },
        key,
      };
    case ContentTab.Data:
      return {
        label,
        data: data ?? { result_sets: [] },
        key,
      };
    case ContentTab.TableStructure:
      return {
        label,
        data: data ?? {
          table: label,
          columns: [],
          indices: [],
          foreign_keys: [],
          primary_key: [],
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
  auto_limit?: boolean;
};

export type TableStructureContentTabData = {
  table: string;
  [TableEntity.columns]: Row[];
  [TableEntity.indices]: Row[];
  [TableEntity.triggers]: Row[];
  [TableEntity.foreign_keys]: Row[];
};

export type DataContentTabData = {
  result_sets: ResultSet[];
  table: string;
};

export type ContentTabType = {
  label: string;
} & (
  | {
      key: typeof ContentTab.Query;
      data: Partial<QueryContentTabData>;
    }
  | {
      key: typeof ContentTab.TableStructure;
      data: Partial<TableStructureContentTabData>;
    }
  | {
      key: typeof ContentTab.Data;
      data: Partial<DataContentTabData>;
    }
);

type Schema = {
  columns: Row[];
  routines: Row[];
  triggers: Row[];
  tables: Table[];
  views: Table[];
};

type ConnectionTab = {
  label: string;
  id: string;
  selectedSchema: string;
  definition: { [key: string]: Schema };
  schemas: string[];
  connection: ConnectionConfig;
  tabs: ContentTabType[];
  idx: number;
};

const CONNECTIONS_KEY = '_conn_tabs';

type StoreSavedData = {
  [CONNECTIONS_KEY]: ConnectionStore;
};

const getSavedData = async <T extends keyof StoreSavedData>(key: T) => {
  const str = await cache.get(key);
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
};

export const ConnectionsService = () => {
  const [loading, setLoading] = createSignal(true);
  const [store, setStore] = createStore<ConnectionStore>({
    tabs: [],
    idx: 0,
  });

  const [connections, setConnections] = createStore<ConnectionConfig[]>([]);
  const [queryIdx, setQueryIdx] = createSignal<number>(0);

  const restoreConnectionStore = async () => {
    const res = await invoke('get_connections', {});
    setConnections(res as ConnectionConfig[]);
    try {
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
            return Promise.resolve(res);
          }
        },
        Promise.resolve([] as ConnectionTab[])
      );
      if (tabs.length) {
        setStore(() => ({ ...conn_tabs, tabs }));
      }
      updateStore();
    } finally {
      setLoading(false);
    }
  };

  const updateStore = debounce(async () => {
    await cache.set(CONNECTIONS_KEY, JSON.stringify(store));
    await cache.save();
  }, INTERVAL);

  const addConnectionTab = async (tab: ConnectionTab) => {
    if (store.tabs.length === 10) return;
    if (store.tabs.find((t) => t.id === tab.id)) {
      setStore(
        'idx',
        store.tabs.findIndex((t) => t.id === tab.id)
      );
      return;
    }
    setStore(
      produce((s) => {
        s.tabs.push(tab);
        s.idx = s.tabs.length - 1;
        tab.tabs = [newContentTab('Query', ContentTab.Query)];
        tab.idx = 0;
      })
    );
    updateStore();
  };

  const refreshConnections = async () => {
    const res = await invoke('get_connections', {});
    setConnections(res as ConnectionConfig[]);
  };

  const addConnection = async (conn: {
    dialect: DialectType;
    mode: ModeType;
    credentials: Credentials;
    name: string;
    color: string;
  }) => {
    await invoke('add_connection', conn);
    await refreshConnections();
  };

  const removeConnectionTab = async (id: string) => {
    setStore('idx', 0);
    setStore(
      'tabs',
      store.tabs.filter((t) => t.id !== id)
    );
    updateStore();
  };

  const clearStore = async () => {
    await cache.clear();
    location.reload();
  };

  const getConnection = () => {
    return store.tabs?.[store.idx] ?? {};
  };

  const getContent = () => {
    const conn = getConnection();
    return conn.tabs?.[conn.idx] ?? {};
  };

  const getContentData = <T extends keyof ContentTabData>(_key: T) => {
    const conn = getConnection();
    return conn.tabs[conn.idx].data as ContentTabData[T];
  };

  const addContentTab = (tab?: ContentTabType) => {
    const conn = getConnection();
    if (conn.tabs.length === 10) return;
    setStore(
      produce((s) => {
        s.tabs[s.idx].tabs = [
          ...s.tabs[s.idx].tabs,
          tab ?? newContentTab('Query', ContentTab.Query),
        ];
        s.tabs[s.idx].idx = s.tabs[s.idx].tabs.length - 1;
      })
    );
    updateStore();
  };

  const removeContentTab = (idx?: number) => {
    const conn = getConnection();
    if (conn.tabs.length === 1) return;
    setStore(
      produce((s) => {
        s.tabs[s.idx].tabs.splice(idx ?? s.tabs[s.idx].idx, 1);
        s.tabs[s.idx].idx = s.tabs[s.idx].tabs.length - 1;
      })
    );
    updateStore();
  };

  const setConnectionIdx = (i: number) => {
    if (i < store.tabs.length) {
      setStore('idx', i);
    }
  };

  const setContentIdx = (i: number) => {
    const conn = getConnection();
    if (i < conn.tabs.length) {
      setStore(
        produce((s) => {
          s.tabs[s.idx].idx = i;
        })
      );
      setQueryIdx(0);
    }
  };

  const setNextContentIdx = () => {
    setStore(
      produce((s) => {
        s.tabs[s.idx].idx = (s.tabs[s.idx].idx + 1) % s.tabs[s.idx].tabs.length;
      })
    );
  };

  const setPrevContentIdx = () => {
    setStore(
      produce((s) => {
        const idx = s.tabs[s.idx].idx;
        s.tabs[s.idx].idx =
          (idx - 1 >= 0 ? idx - 1 : s.tabs[s.idx].tabs.length - 1) %
          s.tabs[s.idx].tabs.length;
      })
    );
  };

  const updateConnectionTab = <T extends keyof ConnectionTab>(
    key: T,
    data: ConnectionTab[T],
    idx?: number
  ) => {
    const tab = getConnection();
    if (!tab) return;
    setStore('tabs', idx ?? store.idx, key, data);
    updateStore();
  };

  const updateSchemaDefinition = (conn_id: string, data: Schema) => {
    const tab = getConnection();
    const schema = tab.selectedSchema;
    if (!tab) return;
    setStore(
      produce((s) => {
        s.tabs = s.tabs.map((t) => {
          if (conn_id === t.id) {
            t.definition[schema] = { ...t.definition[schema], ...data };
          }
          return t;
        });
      })
    );
    updateStore();
  };

  const updateContentTab = <T extends 'data'>(
    key: T,
    data: ContentTabType[T],
    idx?: number
  ) => {
    const tab = getContent();
    if (!tab) return;
    const tabIdx = idx ?? getConnection().idx;
    setStore('tabs', store.idx, 'tabs', (tabs) =>
      tabs.map((t, i) => {
        return i === tabIdx ? { ...t, [key]: { ...t[key], ...data } } : t;
      })
    );
    updateStore();
  };

  const insertColumnName = (column: string) => {
    const { query, cursor } = getContentData('Query');
    if (query) {
      const _query =
        query.slice(0, cursor) + column + ', ' + query.slice(cursor);
      setStore(
        produce((s) => {
          const tabIdx = s.tabs[s.idx].idx;
          const data = s.tabs[s.idx].tabs[tabIdx]['data'];
          s.tabs[s.idx].tabs[tabIdx]['data'] = {
            ...data,
            query: _query,
            cursor: cursor + column.length + 2,
          }; // 2 for ', '
        })
      );
    }
  };

  const updateResultSet = (
    tabIdx: number,
    query_idx: number,
    data: Partial<ResultSet>
  ) => {
    setStore(
      produce((s) => {
        const curr = s.tabs[s.idx].tabs[tabIdx]['data'];
        s.tabs[s.idx].tabs[tabIdx]['data'] = {
          ...curr,
          result_sets: (curr as QueryContentTabData).result_sets.map((r, i) =>
            i === query_idx ? { ...r, ...data } : r
          ),
        };
      })
    );
  };

  const getSchemaEntity = <T extends keyof Schema>(entity: T): Schema[T] => {
    const schema = getConnection().selectedSchema;
    if (!schema) return [];
    if (entity === 'tables') {
      return getConnection().definition[schema]?.['tables'] ?? [];
    }
    return getConnection().definition[schema]?.[entity] ?? [];
  };

  const selectPrevQuery = () => {
    if (getContentData('Query').result_sets.length) {
      setQueryIdx((s) =>
        s - 1 >= 0 ? s - 1 : getContentData('Query').result_sets.length - 1
      );
    }
  };

  const selectNextQuery = () => {
    if (getContentData('Query').result_sets.length)
      setQueryIdx((s) => (s + 1) % getContentData('Query').result_sets.length);
  };

  const fetchSchemaEntities = async (connId: string, dialect: DialectType) => {
    console.log('403');
    const [_schemas, columns, routines, triggers, _views] = await Promise.all([
      invoke<RawQueryResult>('get_schemas', { connId }),
      invoke<RawQueryResult>('get_columns', { connId }),
      invoke<RawQueryResult>('get_procedures', { connId }),
      invoke<RawQueryResult>('get_triggers', { connId }),
      invoke<RawQueryResult>('get_views', { connId }),
    ]);
    console.log('411');

    const { views, tables } = columnsToTables(columns, _views, dialect) ?? [];
    const schemas = _schemas.map((d) => String(d['schema']));
    return { schemas, tables, views, routines, columns, triggers };
  };

  return {
    store,
    setStore,
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
    selectPrevQuery,
    selectNextQuery,
    queryIdx,
    updateResultSet,
    insertColumnName,
    getSchemaEntity,
    fetchSchemaEntities,
    loading,
    setLoading,
    updateSchemaDefinition,
    connections,
    setConnections,
    addConnection,
    refreshConnections,
    setPrevContentIdx,
    setNextContentIdx,
  };
};
