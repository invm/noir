export const Schemes = {
  MySQL: 'MySQL',
  PostgreSQL: 'PostgreSQL',
  SQLite: 'SQLite',
} as const;

export type SchemeType = typeof Schemes[keyof typeof Schemes];

export const PORTS_MAP: Record<SchemeType, number> = {
  [Schemes.MySQL]: 3306,
  [Schemes.PostgreSQL]: 5432,
  [Schemes.SQLite]: 0,
} as const;

export const schemes = [Schemes.MySQL, Schemes.PostgreSQL, Schemes.SQLite] as const;

export interface Scheme {
  scheme: typeof Schemes[keyof typeof Schemes];
  username: string;
  password: string | undefined;
  host: string;
  port: number;
  dbname: string;
  params: string | undefined;
};

type HostCredentials = {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

type SocketCredentials = {
  username: string;
  password: string;
  path: string;
  dbname: string;
}

type FileCredentials = {
  path: string;
}

type SchemeCredentialsMap = {
  [Schemes.MySQL]: HostCredentials | SocketCredentials;
  [Schemes.PostgreSQL]: HostCredentials | SocketCredentials;
  [Schemes.SQLite]: FileCredentials;
}

const ConnectionModes = {
  Host: 'Host',
  Socket: 'Socket',
  File: 'File',
} as const;

export type ConnectionMode = typeof ConnectionModes[keyof typeof ConnectionModes];

export const connectionModes = [ConnectionModes.Host, ConnectionModes.Socket, ConnectionModes.File] as const;

export const AvailableConnectionModes = {
  [Schemes.MySQL]: [ConnectionModes.Host, ConnectionModes.Socket],
  [Schemes.PostgreSQL]: [ConnectionModes.Host, ConnectionModes.Socket],
  [Schemes.SQLite]: [ConnectionModes.File],
} as const;

export interface ConnectionConfig<T extends SchemeType> {
  id: string;
  scheme: SchemeCredentialsMap[T];
  connection_name: string;
  color: string;
  default_db: string;
  save_password: boolean;
  metadata: Record<string, any> | undefined;
};

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
