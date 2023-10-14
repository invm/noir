export const Dialect = {
  Mysql: 'Mysql',
  Postgres: 'Postgres',
  Sqlite: 'Sqlite',
} as const;

export type DialectType = keyof typeof Dialect;

export const PORTS_MAP: Record<DialectType, number> = {
  [Dialect.Mysql]: 3306,
  [Dialect.Postgres]: 5432,
  [Dialect.Sqlite]: 0,
} as const;

export const dialects = [
  Dialect.Mysql,
  Dialect.Postgres,
  Dialect.Sqlite,
] as const;

export type HostCredentials = {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
};

export type SocketCredentials = {
  username: string;
  password: string;
  path: string;
  dbname: string;
};

export type FileCredentials = {
  path: string;
};

export const ConnectionMode = {
  Host: 'Host',
  Socket: 'Socket',
  File: 'File',
} as const;

export type ConnectionModeType = keyof typeof ConnectionMode;

export const SocketPathDefaults = {
  [Dialect.Mysql]: '/var/run/mysqld/mysqld.sock',
  [Dialect.Postgres]: '/var/run/postgresql/.s.PGSQL.5432',
  [Dialect.Sqlite]: '',
} as const;

export const AvailableConnectionModes = {
  [Dialect.Mysql]: [ConnectionMode.Host, ConnectionMode.Socket],
  [Dialect.Postgres]: [ConnectionMode.Host, ConnectionMode.Socket],
  [Dialect.Sqlite]: [ConnectionMode.File],
} as const;

export const connectionModes = [
  ConnectionMode.Host,
  ConnectionMode.Socket,
  ConnectionMode.File,
] as const;

export type Scheme = Partial<
  Record<DialectType, Record<ConnectionModeType, Record<string, string>>>
>;

export type ConnectionConfig = {
  id: string;
  name: string;
  scheme: Scheme;
  dialect: DialectType;
  color: ConnectionColor;
};

export const connectionColors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const;

export type ConnectionColor = (typeof connectionColors)[number];

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type Row = Record<string, JSONValue>;

export type ResultSet = {
  id?: string;
  count?: number;
  affected_rows?: number;
  warnings?: number;
  info?: string;
  rows?: Row[];
};

const QueryTaskStatus = {
  Progress: 'Progress',
  Completed: 'Completed',
  Error: 'Error',
} as const;

export type QueryTaskStatusType = keyof typeof QueryTaskStatus;

export type QueryTaskEnqueueResult = {
  conn_id: string;
  tab_id: string;
  status: QueryTaskStatusType;
  results_sets: string[];
};

export type QueryTaskResult = {
  conn_id: string;
  status: QueryTaskStatusType;
  query: string;
  id: string;
  tab_idx: number;
  query_idx: number;
} & (
    | {
      status: 'Error';
      error: string;
    }
    | {
      status: 'Completed';
      path: string;
    }
  );

export type RawQueryResult = {
  result: Row[];
};

export const TableEntity = {
  columns: 'columns',
  indices: 'indices',
  constraints: 'constraints',
  triggers: 'triggers',
} as const;

export type TableStrucureEntityType = keyof typeof TableEntity;

export const TableStrucureEntities = [
  TableEntity.columns,
  TableEntity.indices,
  TableEntity.constraints,
  TableEntity.triggers,
] as const;

export const SORT_ORDER = {
  [Dialect.Mysql]: {
    [TableEntity.columns]: [
      'COLUMN_NAME',
      'COLUMN_TYPE',
      'IS_NULLABLE',
      'CHARACTER_MAXIMUM_LENGTH',
    ],
    [TableEntity.indices]: ['INDEX_NAME', 'NON_UNIQUE', 'COLUMN_NAME'],
    [TableEntity.constraints]: [
      'CONSTRAINT_NAME',
      'TABLE_NAME',
      'COLUMN_NAME',
      'REFERENCED_COLUMN_NAME',
      'REFERENCED_TABLE_NAME',
    ],
    [TableEntity.triggers]: [
      'TRIGGER_NAME',
      'EVENT_MANIPULATION',
      'EVENT_OBJECT_TABLE',
      'ACTION_TIMING',
      'ACTION_STATEMENT',
    ],
  },
  [Dialect.Postgres]: {
    [TableEntity.columns]: [
      'COLUMN_NAME',
      'DATA_TYPE',
      'IS_NULLABLE',
      'CHARACTER_MAXIMUM_LENGTH',
    ],
    [TableEntity.indices]: ['INDEX_NAME', 'COLUMN_NAME'],
    [TableEntity.constraints]: [
      'CONSTRAINT_NAME',
      'TABLE_NAME',
      'COLUMN_NAME',
      'REFERENCED_COLUMN_NAME',
      'REFERENCED_TABLE_NAME',
    ],
    [TableEntity.triggers]: [
      'TRIGGER_NAME',
      'EVENT_MANIPULATION',
      'EVENT_OBJECT_TABLE',
      'ACTION_TIMING',
      'ACTION_STATEMENT',
    ],
  },
  [Dialect.Sqlite]: {
    [TableEntity.columns]: [
      'COLUMN_NAME',
      'DATA_TYPE',
      'IS_NULLABLE',
      'CHARACTER_MAXIMUM_LENGTH',
    ],
    [TableEntity.indices]: ['INDEX_NAME', 'COLUMN_NAME'],
    [TableEntity.constraints]: [
      'CONSTRAINT_NAME',
      'TABLE_NAME',
      'COLUMN_NAME',
      'REFERENCED_COLUMN_NAME',
      'REFERENCED_TABLE_NAME',
    ],
    [TableEntity.triggers]: [
      'TRIGGER_NAME',
      'EVENT_MANIPULATION',
      'EVENT_OBJECT_TABLE',
      'ACTION_TIMING',
      'ACTION_STATEMENT',
    ],
  },
} as const;

export type Column = {
  name: string;
  props: Record<string, string>;
};

export type Table = {
  name: string;
  columns: Column[];
};

export const Events = {
  QueryFinished: 'query_finished',
} as const;

export type QueryMetadataResult = Omit<ResultSet, 'rows' | 'id'>;
