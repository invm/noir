export const Schemes = {
  Mysql: 'Mysql',
  Postgres: 'Postgres',
  Sqlite: 'Sqlite',
} as const;

export type SchemeType = keyof typeof Schemes;

export const PORTS_MAP: Record<SchemeType, number> = {
  [Schemes.Mysql]: 3306,
  [Schemes.Postgres]: 5432,
  [Schemes.Sqlite]: 0,
} as const;

export const schemes = [Schemes.Mysql, Schemes.Postgres, Schemes.Sqlite] as const;

export type HostCredentials = {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

export type SocketCredentials = {
  username: string;
  password: string;
  path: string;
  dbname: string;
}

export type FileCredentials = {
  path: string;
}

export const ConnectionMode = {
  Host: 'Host',
  Socket: 'Socket',
  File: 'File',
} as const;

export const SocketPathDefaults = {
  [Schemes.Mysql]: '/var/run/mysqld/mysqld.sock',
  [Schemes.Postgres]: '/var/run/postgresql/.s.PGSQL.5432',
  [Schemes.Sqlite]: '',
} as const;

export const AvailableConnectionModes = {
  [Schemes.Mysql]: [ConnectionMode.Host, ConnectionMode.Socket],
  [Schemes.Postgres]: [ConnectionMode.Host, ConnectionMode.Socket],
  [Schemes.Sqlite]: [ConnectionMode.File],
} as const;

export const connectionModes = [ConnectionMode.Host, ConnectionMode.Socket, ConnectionMode.File] as const;

export const connectionColors = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const

export type ConnectionColor = typeof connectionColors[number];
