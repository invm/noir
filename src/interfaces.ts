export const Dialect = {
  Mysql: 'Mysql',
  MariaDB: 'MariaDB',
  Postgresql: 'Postgresql',
  Sqlite: 'Sqlite',
} as const;

export type DialectType = keyof typeof Dialect;

export const PORTS_MAP: Record<DialectType, number> = {
  [Dialect.Mysql]: 3306,
  [Dialect.MariaDB]: 3306,
  [Dialect.Postgresql]: 5432,
  [Dialect.Sqlite]: 0,
} as const;

export const dialects = [
  Dialect.Postgresql,
  Dialect.Mysql,
  Dialect.MariaDB,
  Dialect.Sqlite,
] as const;

export const Mode = {
  Host: 'Host',
  Socket: 'Socket',
  Ssh: 'Ssh',
  File: 'File',
} as const;

export type ModeType = keyof typeof Mode;

export const SocketPathDefaults = {
  [Dialect.MariaDB]: '/var/run/mysqld/mysqld.sock',
  [Dialect.Mysql]: '/var/run/mysqld/mysqld.sock',
  [Dialect.Postgresql]: '/var/run/postgresql/.s.PGSQL.5432',
  [Dialect.Sqlite]: '',
} as const;

export const AvailableModes = {
  [Dialect.MariaDB]: [Mode.Host, Mode.Socket, Mode.Ssh],
  [Dialect.Mysql]: [Mode.Host, Mode.Socket, Mode.Ssh],
  [Dialect.Postgresql]: [Mode.Host, Mode.Socket, Mode.Ssh],
  [Dialect.Sqlite]: [Mode.File],
} as const;

export const SslMode = {
  disable: 'disable',
  prefer: 'prefer',
  require: 'require',
} as const;

export const connectionModes = [
  Mode.Host,
  Mode.Socket,
  Mode.File,
  Mode.Ssh,
] as const;

export const sslModes = [
  SslMode.disable,
  SslMode.prefer,
  SslMode.require,
] as const;

export type Credentials = Record<string, string | number>;

export type ConnectionConfig = {
  id: string;
  dialect: DialectType;
  mode: ModeType;
  credentials: Credentials;
  schema: string;
  name: string;
  color: ConnectionColor;
};

export const connectionColors = [
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'gray',
  'green',
  'indigo',
  'lime',
  'neutral',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'slate',
  'stone',
  'teal',
  'violet',
  'yellow',
  'zinc',
] as const;

export const NumericTypes = [
  'int',
  'long',
  'float',
  'double',
  'decimal',
  'numeric',
  'real',
  'number',
  'serial',
  'short',
] as const;

export type ConnectionColor = (typeof connectionColors)[number];

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type Row = Record<string, JSONValue>;

export type QueryType = 'Select' | 'Other';

export type ResultSet = {
  loading: boolean;
  id?: string;
  count?: number;
  affected_rows?: number;
  query_type?: QueryType;
  rows?: Row[];
  table?: string;
  foreign_keys?: Row[];
  primary_key?: Row[];
  columns?: Row[];
  start_time?: number;
  end_time?: number;
} & (
  | {
      path?: string;
      status?: (typeof QueryTaskStatus)['Completed'];
    }
  | {
      status?: (typeof QueryTaskStatus)['Error'];
      error?: string;
    }
);

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
  result_sets: string[];
};

export type QueryTaskResult = {
  conn_id: string;
  status: QueryTaskStatusType;
  query: string;
  id: string;
  tab_idx: number;
  query_idx: number;
  count: number;
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

export type RawQueryResult = Row[];

export const TableEntity = {
  columns: 'columns',
  indices: 'indices',
  foreign_keys: 'foreign_keys',
  triggers: 'triggers',
} as const;

export type TableStrucureEntityType = keyof typeof TableEntity;

export const TableStrucureEntities = [
  TableEntity.columns,
  TableEntity.indices,
  TableEntity.foreign_keys,
  TableEntity.triggers,
] as const;

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
