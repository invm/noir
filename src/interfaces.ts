export const Scheme = {
  MySQL: 'mysql',
  PostgreSQL: 'postgresql',
  SQLite: 'sqlite',
} as const;

export const schemes = [Scheme.MySQL, Scheme.PostgreSQL, Scheme.SQLite] as const;

export interface Credentials {
  scheme: typeof Scheme[keyof typeof Scheme];
  username: string;
  password: string | undefined;
  host: string;
  port: number;
  dbname: string;
  params: string | undefined;
};

export interface DBConnection {
  id: number;
  name: string;
  color: string;
  credentials: Credentials;
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
