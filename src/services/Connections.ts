import { createStore, produce } from 'solid-js/store';
import { editor, Position } from 'monaco-editor';
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
import { columnsToTables, randomId } from 'utils/utils';
import { invoke } from '@tauri-apps/api/core';
import { createSignal } from 'solid-js';
import { load } from '@tauri-apps/plugin-store';

const cache = await load('.connections.dat', { autoSave: false });
// const INTERVAL = 1000;

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
        data: data ?? {
          id: randomId(),
          query: '',
          result_sets: [],
          autoLimit: true,
        },
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
  cursor?: Position | null | undefined;
  result_sets: ResultSet[];
  autoLimit?: boolean;
  query: string;
  viewState?: editor.ICodeEditorViewState | null;
  model?: editor.ITextModel;
  id: string;
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

export type ConnectionTab = {
  label: string;
  id: string;
  selectedSchema: string;
  definition: { [key: string]: Schema };
  schemas: string[];
  connection: ConnectionConfig;
  tabs: ContentTabType[];
  idx: number;
  prevIdx?: number;
};

// const CONNECTIONS_KEY = '_conn_tabs';

// type StoreSavedData = {
//   [CONNECTIONS_KEY]: ConnectionStore;
// };

// const getSavedData = async <T extends keyof StoreSavedData>(key: T) => {
//   const str = await cache.get(key);
//   if (!str) return {} as StoreSavedData[T];
//   try {
//     const res = JSON.parse(str as string);
//     return res as StoreSavedData[T];
//   } catch (e) {
//     return {} as StoreSavedData[T];
//   }
// };

type ConnectionStore = {
  connections: ConnectionTab[];
  idx: number;
};

export const ConnectionsService = () => {
  const [loading, setLoading] = createSignal(true);
  const [store, setStore] = createStore<ConnectionStore>({
    connections: [],
    idx: 0,
  });

  const [connections, setConnections] = createStore<ConnectionConfig[]>([]);
  const [queryIdx, setQueryIdx] = createSignal<number>(0);

  const restoreConnectionStore = async () => {
    const res = await invoke('get_connections', {});
    setConnections(res as ConnectionConfig[]);
    updateStore();
    // try {
    //   const conn_tabs: ConnectionStore = await getSavedData(CONNECTIONS_KEY);
    //   if (!conn_tabs.tabs) return;
    //   const tabs = await conn_tabs.tabs.reduce(
    //     async (acc, conn) => {
    //       const res = await acc;
    //       try {
    //         const selectedSchema = await invoke<string>('init_connection', {
    //           config: conn.connection,
    //         });
    //         conn.selectedSchema = selectedSchema;
    //         return Promise.resolve([...res, conn]);
    //       } catch (e) {
    //         conn_tabs.idx = 0;
    //         return Promise.resolve(res);
    //       } finally {
    //         setTimeout(() => Promise.resolve(), 10000);
    //       }
    //     },
    //     Promise.resolve([] as ConnectionTab[])
    //   );
    //   if (tabs.length) {
    //     setStore(() => ({ ...conn_tabs, tabs }));
    //   }
    //   updateStore();
    // } finally {
    //   setLoading(false);
    // }
  };

  const updateStore = () => {};

  // FIXME: saving model and viewstate in the store can not be saved in as the json.stringinfy will not handle it
  // const updateStore = debounce(async () => {
  //   await cache.set(CONNECTIONS_KEY, JSON.stringify(store));
  //   await cache.save();
  // }, INTERVAL);
  //
  const addConnectionTab = async (tab: ConnectionTab) => {
    if (store.connections.length === 10) return;
    if (store.connections.find((t) => t.id === tab.id)) {
      setStore(
        'idx',
        store.connections.findIndex((t) => t.id === tab.id)
      );
      return;
    }
    setStore(
      produce((s) => {
        s.connections.push(tab);
        s.idx = s.connections.length - 1;
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

  const updateConnection = async (conn: ConnectionConfig) => {
    await invoke('update_connection', conn);
    await refreshConnections();
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

  const removeConnection = async (id: string) => {
    setStore('idx', 0);
    setStore(
      'connections',
      store.connections.filter((t) => t.id !== id)
    );
    updateStore();
  };

  const clearStore = async () => {
    await cache.clear();
    location.reload();
  };

  const getConnection = () => {
    return store.connections?.[store.idx] ?? {};
  };

  const getContent = (idx?: number) => {
    const conn = getConnection();
    return conn.tabs?.[idx || conn.idx] ?? {};
  };

  const getContentData = <T extends keyof ContentTabData>(_key: T) => {
    return getContent().data as ContentTabData[T];
  };

  const addContentTab = (tab?: ContentTabType) => {
    const conn = getConnection();
    if (!conn.tabs?.length || conn.tabs.length === 10) return;
    setStore(
      produce((s) => {
        s.connections[s.idx].tabs = [
          ...s.connections[s.idx].tabs,
          tab ?? newContentTab('Query', ContentTab.Query),
        ];
        s.connections[s.idx].idx = s.connections[s.idx].tabs.length - 1;
      })
    );
    updateStore();
  };

  const removeCurrentContentTab = () => {
    const conn = getConnection();
    if (conn.tabs.length === 1) return;
    const idx = conn.idx;
    setStore(
      produce((s) => {
        s.connections[s.idx].tabs.splice(idx ?? s.connections[s.idx].idx, 1);
        s.connections[s.idx].idx = s.connections[s.idx].tabs.length - 1;
      })
    );
    updateStore();
  };

  const removeContentTab = (idx?: number) => {
    const conn = getConnection();
    if (!conn.tabs?.length || conn.tabs.length === 1 || conn.idx === 0) return;
    setStore(
      produce((s) => {
        s.connections[s.idx].tabs.splice(idx ?? s.connections[s.idx].idx, 1);
        s.connections[s.idx].idx = s.connections[s.idx].tabs.length - 1;
      })
    );
    updateStore();
  };

  const setConnectionIdx = (i: number) => {
    if (i < store.connections.length) {
      setStore('idx', i);
    }
  };

  const selectConnection = (id: string) => {
    const idx = store.connections.findIndex((c) => c.id === id);
    if (idx >= 0) {
      setStore('idx', idx);
    }
  };

  const setContentIdx = (i: number) => {
    const conn = getConnection();
    if (!conn.tabs?.length) return;
    if (i < conn.tabs.length) {
      setStore(
        produce((s) => {
          s.connections[s.idx].prevIdx = s.connections[s.idx].idx;
          s.connections[s.idx].idx = i;
        })
      );
      setQueryIdx(0);
    }
  };

  const setNextContentIdx = () => {
    if (!store.connections.length) return;
    setStore(
      produce((s) => {
        s.connections[s.idx].idx =
          (s.connections[s.idx].idx + 1) % s.connections[s.idx].tabs.length;
      })
    );
  };

  const setPrevContentIdx = () => {
    if (!store.connections.length) return;
    setStore(
      produce((s) => {
        const idx = s.connections[s.idx].idx;
        s.connections[s.idx].idx =
          (idx - 1 >= 0 ? idx - 1 : s.connections[s.idx].tabs.length - 1) %
          s.connections[s.idx].tabs.length;
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
    setStore('connections', idx ?? store.idx, key, data);
    updateStore();
  };

  const updateSchemaDefinition = (data: Schema) => {
    const conn = getConnection();
    const schema = conn.selectedSchema;
    if (!conn) return;
    setStore(
      produce((s) => {
        s.connections[s.idx].definition[schema] = data;
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
    setStore(
      produce((s) => {
        const _idx = idx ?? s.connections[s.idx]['idx'];
        const elem = s.connections[s.idx]['tabs'][_idx];
        if (!elem) return;
        s.connections[s.idx]['tabs'][_idx][key] = { ...elem?.[key], ...data };
      })
    );
    updateStore();
  };

  const updateDataContentTab = <T extends keyof QueryContentTabData>(
    key: T,
    data: QueryContentTabData[T],
    idx?: number
  ) => {
    setStore(
      produce((s) => {
        const _idx = idx ?? s.connections[s.idx]['idx'];
        (s.connections[s.idx]['tabs'][_idx]['data'] as QueryContentTabData)[
          key
        ] = data;
      })
    );
    updateStore();
  };

  const insertColumnName = (_column: string) => {
    // TODO:
    // const { query, cursor } = getContentData('Query');
    // if (query) {
    //   const _query =
    //     query.slice(0, cursor) + column + ', ' + query.slice(cursor);
    //   setStore(
    //     produce((s) => {
    //       const tabIdx = s.connections[s.idx].idx;
    //       const data = s.connections[s.idx].tabs[tabIdx]['data'];
    //       s.connections[s.idx].tabs[tabIdx]['data'] = {
    //         ...data,
    //         query: _query,
    //         cursor: cursor + column.length + 2,
    //       }; // 2 for ', '
    //     })
    //   );
    // }
  };

  const updateResultSet = (
    tabIdx: number,
    query_idx: number,
    data: Partial<ResultSet>
  ) => {
    setStore(
      produce((s) => {
        const currResultSet = (
          s.connections[s.idx].tabs[tabIdx]['data'] as QueryContentTabData
        ).result_sets[query_idx];
        (
          s.connections[s.idx].tabs[tabIdx]['data'] as QueryContentTabData
        ).result_sets[query_idx] = {
          ...currResultSet,
          ...data,
          loading: false,
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
    const [_schemas, columns, routines, triggers, _views] = await Promise.all([
      invoke<RawQueryResult>('get_schemas', { connId }),
      invoke<RawQueryResult>('get_columns', { connId }),
      invoke<RawQueryResult>('get_procedures', { connId }),
      invoke<RawQueryResult>('get_triggers', { connId }),
      invoke<RawQueryResult>('get_views', { connId }),
    ]);

    const { views, tables } = columnsToTables(columns, _views, dialect) ?? [];
    const schemas = _schemas.map((d) => String(d['schema'])).sort();
    return { schemas, tables, views, routines, columns, triggers };
  };

  const refreshEntities = async () => {
    const config = getConnection().connection;
    setLoading(true);
    await invoke('init_connection', { config });
    const { triggers, routines, tables, schemas, columns, views } =
      await fetchSchemaEntities(config.id, config.dialect);
    updateConnectionTab('schemas', schemas);
    updateSchemaDefinition({
      triggers,
      routines,
      columns,
      tables,
      views,
    });
  };

  return {
    store,
    setStore,
    addConnectionTab,
    removeConnection,
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
    updateConnection,
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
    refreshEntities,
    selectConnection,
    removeCurrentContentTab,
    updateDataContentTab,
  };
};
