export const Dialect = {
  Mysql: 'Mysql',
  Postgresql: 'Postgresql',
  Sqlite: 'Sqlite',
} as const;

export type DialectType = keyof typeof Dialect;

export const PORTS_MAP: Record<DialectType, number> = {
  [Dialect.Mysql]: 3306,
  [Dialect.Postgresql]: 5432,
  [Dialect.Sqlite]: 0,
} as const;

export const dialects = [Dialect.Mysql, Dialect.Postgresql, Dialect.Sqlite] as const;

export const Mode = {
  Host: 'Host',
  Socket: 'Socket',
  File: 'File',
} as const;

export type ModeType = keyof typeof Mode;

export const SocketPathDefaults = {
  [Dialect.Mysql]: '/var/run/mysqld/mysqld.sock',
  [Dialect.Postgresql]: '/var/run/postgresql/.s.PGSQL.5432',
  [Dialect.Sqlite]: '',
} as const;

export const AvailableModes = {
  [Dialect.Mysql]: [Mode.Host, Mode.Socket],
  [Dialect.Postgresql]: [Mode.Host, Mode.Socket],
  [Dialect.Sqlite]: [Mode.File],
} as const;

export const connectionModes = [Mode.Host, Mode.Socket, Mode.File] as const;

export type Credentials = Record<string, string>;

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

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export type Row = Record<string, JSONValue>;

export type ResultSet = {
  id?: string;
  count?: number;
  affected_rows?: number;
  warnings?: number;
  rows?: Row[];
  table?: string;
  constraints?: Row[];
  columns?: Row[];
} & (
    | {
      path?: string;
      status?: (typeof QueryTaskStatus)['Completed'];
      info?: string;
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
