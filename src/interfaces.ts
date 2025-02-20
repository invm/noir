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

export type Metadata = {
  sensitive: boolean;
};

export type Credentials = Record<string, string | number>;

export type ConnectionConfig = {
  id: string;
  dialect: DialectType;
  mode: ModeType;
  credentials: Credentials;
  schema: string;
  metadata: Metadata;
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
  'integer',
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
  | null
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

export const loadingMessages = [
  'SELECT * FROM patience WHERE exists = true',
  "INSERT INTO brain (caffeine) VALUES ('loading')",
  'JOIN-ing the dots...',
  'DROP TABLE boredom;',
  'Counting to infinity (twice)...',
  'Generating witty loading message...',
  'Making the database do party tricks...',
  'Have you tried turning it OFF and ON again?',
  'Coffee.exe is still brewing...',
  'Dividing by zero...',
  'Loading loading message...',
  'Downloading more RAM...',
  'Convincing MySQL to hurry up...',
  'PostgreSQL is feeling philosophical...',
  'SQLite is living its best life...',
  'Teaching ACID properties to teenagers...',
  'WHERE did I put that data?',
  'GROUP BY anxiety level',
  'ORDER BY importance DESC',
  'COMMIT to waiting...',
  'No FOREIGN KEY violations were harmed',
  "INSERT INTO brain (caffeine_level) VALUES ('more')",
  'DELETE FROM stress WHERE waiting = true',
  'Creating index on motivation...',
  'ROLLBACK to sanity',
  'Optimizing query life choices',
  'ALTER TABLE characteristics ADD COLUMN patience',
  "UPDATE users SET status = 'still_waiting'",
  "SELECT * FROM magic WHERE reality = 'loading'",
  'MERGE INTO patience USING coffee',
  'Establishing TCP/IP (Tea/Coffee/Internet Protocol)',
  'Quantum SQL processing in progress...',
  'Converting caffeine to queries...',
  'Bribing the database hamsters...',
  'Teaching SQL to the interns...',
  'Convincing bits to move faster...',
  'Warming up the JOIN engines...',
  'ON CONFLICT DO nothing_but_wait',
  'TRUNCATE anxiety',
  'GRANT patience TO user',
  'EXPLAIN ANALYZE why this is taking so long',
  'DISTINCT-ly taking longer than expected',
  'UNION-izing all workers to fetch data',
  'MERGE-ing your patience with reality',
  'HAVING trouble finding your data...',
  'ORDER BY loading_time DESC',
  'WHERE did all the data go?',
  'Where am I?',
  'Please let me out of here!',
];

export const DEFAULT_SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'OUTER',
  'LEFT',
  'RIGHT',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'INSERT',
  'UPDATE',
  'DELETE',
  'VALUES',
  'CREATE',
  'DROP',
  'ALTER',
  'TABLE',
  'INDEX',
  'VIEW',
  'TRIGGER',
  'PROCEDURE',
  'FUNCTION',
  'DISTINCT',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'IN',
  'LIKE',
  'IS',
  'NULL',
  'EXISTS',
  'ALL',
  'ANY',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'AS',
  'WITH',
  'LIMIT',
  'OFFSET',
  'INNER JOIN',
  'FULL OUTER JOIN',
  'CROSS JOIN',
  'SET',
  'CONSTRAINT',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'CHECK',
  'UNIQUE',
  'DEFAULT',
  'REFERENCES',
  'AUTO_INCREMENT',
];
