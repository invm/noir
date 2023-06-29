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

export const ConnectionModes = {
  Host: 'Host',
  Socket: 'Socket',
  File: 'File',
} as const;

export type SchemeCredentialsMap = {
  [Schemes.MySQL]: {
    [ConnectionModes.Host]: HostCredentials;
    [ConnectionModes.Socket]: SocketCredentials;
  },
  [Schemes.PostgreSQL]: {
    [ConnectionModes.Host]: HostCredentials;
    [ConnectionModes.Socket]: SocketCredentials;
  }
  [Schemes.SQLite]: {
    [ConnectionModes.File]: FileCredentials;
  }
}

export type ConnectionModeToCredentialsMap = {
  [ConnectionModes.Host]: HostCredentials;
  [ConnectionModes.Socket]: SocketCredentials;
  [ConnectionModes.File]: FileCredentials;
}

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
  name: string;
  color: string;
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
