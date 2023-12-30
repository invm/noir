use anyhow::Result;
use deadpool_postgres::{
    tokio_postgres::NoTls, Config, ManagerConfig, Pool as PostgresqlPool, RecyclingMethod,
};
use log::info;
use mysql::{Opts, OptsBuilder, Pool as MysqlPool};
use rusqlite::types::{self, FromSql, FromSqlResult, ValueRef};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, fmt};
use uuid::Uuid;

use super::engine;

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum Dialect {
    Mysql,
    Postgresql,
    Sqlite,
}

impl fmt::Display for Dialect {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Dialect::Mysql => write!(f, "Mysql"),
            Dialect::Postgresql => write!(f, "Postgresql"),
            Dialect::Sqlite => write!(f, "Sqlite"),
        }
    }
}

impl FromSql for Dialect {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let s: String = String::column_result(value)?;
        match s.as_str() {
            "Mysql" => Ok(Dialect::Mysql),
            "Postgresql" => Ok(Dialect::Postgresql),
            "Sqlite" => Ok(Dialect::Sqlite),
            _ => Err(types::FromSqlError::InvalidType),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum Mode {
    Host,
    Socket,
    File,
}

impl fmt::Display for Mode {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Mode::Host => write!(f, "Host"),
            Mode::Socket => write!(f, "Socket"),
            Mode::File => write!(f, "File"),
        }
    }
}

impl FromSql for Mode {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let s: String = String::column_result(value)?;
        match s.as_str() {
            "Host" => Ok(Mode::Host),
            "Socket" => Ok(Mode::Socket),
            "File" => Ok(Mode::File),
            _ => Err(types::FromSqlError::InvalidType),
        }
    }
}

pub type Credentials = HashMap<String, String>;

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct ConnectionConfig {
    pub id: Uuid,
    pub dialect: Dialect,
    pub mode: Mode,
    pub credentials: Credentials,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone)]
pub enum ConnectionPool {
    Mysql(MysqlPool),
    Postgresql(PostgresqlPool),
    Sqlite,
}

#[derive(Debug, Clone)]
pub enum ConnectionOpts {
    Mysql(Opts),
    Postgresql(Config),
    Sqlite,
}

#[derive(Debug, Clone)]
pub struct InitiatedConnection {
    pub config: ConnectionConfig,
    pub pool: ConnectionPool,
    pub opts: ConnectionOpts,
    pub schema: String,
}

impl ConnectionConfig {
    pub fn new(
        dialect: Dialect,
        mode: Mode,
        mut credentials: HashMap<String, String>,
        name: &str,
        color: &str,
    ) -> Result<Self> {
        if name.is_empty() {
            return Err(anyhow::anyhow!("Connection name cannot be empty"));
        }
        if color.is_empty() {
            return Err(anyhow::anyhow!("Color cannot be empty"));
        }
        match dialect {
            Dialect::Mysql => {
                let available_keys = vec![
                    "pool_min",
                    "pool_max",
                    "user",
                    "password",
                    "host",
                    "port",
                    "socket",
                    "db_name",
                    "prefer_socket",
                    "tcp_keepalive_time_ms",
                    "tcp_keepalive_probe_interval_secs",
                    "tcp_keepalive_probe_count",
                    "tcp_user_timeout_ms",
                    "compress",
                    "tcp_connect_timeout_ms",
                    "stmt_cache_size",
                    "secure_auth",
                ];
                let _ = credentials.retain(|k, _| available_keys.contains(&k.as_str()));
                Ok(ConnectionConfig {
                    id: Uuid::new_v4(),
                    dialect,
                    mode,
                    credentials,
                    name: name.to_string(),
                    color: color.to_string(),
                })
            }
            Dialect::Postgresql => {
                let available_keys = vec![
                    "user",
                    "password",
                    "db_name",
                    "options",
                    "application_name",
                    "sslmode",
                    "host",
                    "port",
                    "connect_timeout",
                    "keepalives",
                    "keepalives_idle",
                    "target_session_attrs",
                    "transaction_read_write",
                ];
                let _ = credentials.retain(|k, _| available_keys.contains(&k.as_str()));
                Ok(ConnectionConfig {
                    id: Uuid::new_v4(),
                    dialect,
                    mode,
                    credentials,
                    name: name.to_string(),
                    color: color.to_string(),
                })
            }
            Dialect::Sqlite => todo!(),
        }
    }

    pub async fn init(&mut self) -> Result<InitiatedConnection> {
        match &self.dialect {
            Dialect::Mysql => {
                if self.mode == Mode::File {
                    return Err(anyhow::anyhow!("File mode is not supported for Mysql"));
                }
                let builder = OptsBuilder::new();
                let builder = builder
                    .from_hash_map(&self.credentials)?
                    .tcp_connect_timeout(Some(std::time::Duration::from_secs(15)))
                    .prefer_socket(self.mode == Mode::Socket);
                let opts = Opts::from(builder);
                let cloned = opts.clone();
                match MysqlPool::new(opts.clone()) {
                    Ok(pool) => {
                        let schema = cloned.get_db_name().unwrap_or("");
                        Ok(InitiatedConnection {
                            config: self.clone(),
                            pool: ConnectionPool::Mysql(pool),
                            opts: ConnectionOpts::Mysql(opts),
                            schema: schema.to_string(),
                        })
                    }
                    Err(e) => {
                        info!("Error connecting to mysql: {}", e);
                        Err(anyhow::anyhow!("Error connecting to mysql: {}", e))
                    }
                }
            }
            Dialect::Postgresql => {
                if self.mode == Mode::File {
                    return Err(anyhow::anyhow!("File mode is not supported for Postgresql"));
                }
                let mut config = Config::new();
                config.user = self.credentials.get("user").cloned();
                config.password = self.credentials.get("password").cloned();
                config.dbname = self.credentials.get("db_name").cloned();
                config.host = self.credentials.get("host").cloned();
                config.port = self
                    .credentials
                    .get("port")
                    .cloned()
                    .map(|p| p.parse::<u16>().expect("Port should be a valid number"));
                config.connect_timeout = Some(std::time::Duration::from_secs(15));
                config.manager = Some(ManagerConfig {
                    recycling_method: RecyclingMethod::Fast,
                });
                match config.create_pool(Some(deadpool_postgres::Runtime::Tokio1), NoTls) {
                    // in case of sockets, the url should be percent-encoded
                    Ok(pool) => {
                        let cfg = config.clone();
                        Ok(InitiatedConnection {
                            config: self.clone(),
                            pool: ConnectionPool::Postgresql(pool),
                            opts: ConnectionOpts::Postgresql(cfg),
                            schema: "public".to_string(),
                        })
                    }
                    Err(e) => {
                        info!("Error connecting to postgresql: {}", e);
                        Err(anyhow::anyhow!("Error connecting to postgresql: {}", e))
                    }
                }
            }
            Dialect::Sqlite => todo!(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultSet {
    pub affected_rows: u64,
    pub warnings: u16,
    pub info: String,
    pub rows: Vec<serde_json::Value>,
}

impl InitiatedConnection {
    pub fn get_schema(&self) -> String {
        self.schema.clone()
    }

    pub fn set_schema(mut self, schema: String) -> Self {
        self.schema = schema;
        self
    }

    pub async fn get_table_structure(&self, table: String) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_table_structure(self, pool, table).await
            }
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_table_structure(self, pool, table).await
            }
            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_indices(&self, table: Option<&str>) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_indices(self, pool, table).await
            }
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_indices(self, pool, table).await
            }

            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_columns(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_columns(self, pool, None).await
            }
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_columns(&self, pool, None).await
            }

            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_constraints(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_constraints(self, pool, None).await
            }
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_constraints(self, pool, None).await
            }

            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_functions(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_functions(self, pool).await,
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_functions(self, pool).await
            }
            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_procedures(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_procedures(self, pool).await,
            ConnectionPool::Postgresql(pool) =>engine::postgresql::tables::get_procedures(self, pool).await,
            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_triggers(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_triggers(self, pool, None).await
            }
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::tables::get_triggers(self, pool, None).await
            }
            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn get_schemas(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_schemas(pool).await,
            ConnectionPool::Postgresql(pool) => engine::postgresql::tables::get_schemas(pool).await,
            ConnectionPool::Sqlite => todo!(),
        }
    }

    pub async fn execute_query(&self, q: &str) -> Result<ResultSet> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::query::execute_query(pool, q),
            ConnectionPool::Postgresql(pool) => {
                engine::postgresql::query::execute_query(pool, q).await
            }
            ConnectionPool::Sqlite => todo!(),
        }
    }
}
