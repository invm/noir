export interface Credentials {
  scheme: string;
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
