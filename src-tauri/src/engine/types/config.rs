use anyhow::Result;
use deadpool_sqlite::rusqlite::types::{self, FromSql, FromSqlResult, ValueRef};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fmt};
use uuid::Uuid;

use deadpool_postgres::Pool as PostgresqlPool;
use deadpool_sqlite::Pool as SqlitePool;

#[derive(Debug, Clone)]
pub enum ConnectionPool {
    Mysql(sqlx::MySqlPool),
    MariaDB(sqlx::MySqlPool),
    Postgresql(PostgresqlPool),
    Sqlite(SqlitePool),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum Dialect {
    Mysql,
    MariaDB,
    Postgresql,
    Sqlite,
}

impl fmt::Display for Dialect {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Dialect::Mysql => write!(f, "Mysql"),
            Dialect::MariaDB => write!(f, "MariaDB"),
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
            "MariaDB" => Ok(Dialect::MariaDB),
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
    pub schema: String,
    pub name: String,
    pub color: String,
}

impl ConnectionConfig {
    pub fn new(
        dialect: Dialect,
        mode: Mode,
        mut credentials: Credentials,
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
            Dialect::Mysql | Dialect::MariaDB => {
                let allowed_keys = vec![
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
                    // later before connecting those keys are omitted and everything else is passed to cfg builder
                    "ssl_mode",
                    "ca_cert",
                    "client_cert",
                    "client_key",
                ];
                credentials.retain(|k, _| allowed_keys.contains(&k.as_str()));
                let schema = credentials
                    .get("db_name")
                    .cloned()
                    .unwrap_or("".to_string());
                Ok(ConnectionConfig {
                    id: Uuid::new_v4(),
                    dialect,
                    mode,
                    credentials,
                    name: name.to_string(),
                    color: color.to_string(),
                    schema,
                })
            }
            Dialect::Postgresql => {
                let allowed_keys = vec![
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
                    "ssl_mode", // disable, prefer, require, if with ca_cert ssl verify mode is peer
                    "ca_cert",
                    "client_cert",
                    "client_key",
                ];
                credentials.retain(|k, _| allowed_keys.contains(&k.as_str()));
                Ok(ConnectionConfig {
                    id: Uuid::new_v4(),
                    dialect,
                    mode,
                    credentials,
                    name: name.to_string(),
                    color: color.to_string(),
                    schema: "public".to_string(),
                })
            }
            Dialect::Sqlite => {
                let available_keys = ["path"];
                credentials.retain(|k, _| available_keys.contains(&k.as_str()));
                let schema = credentials.get("path").cloned().unwrap_or("".to_string());
                Ok(ConnectionConfig {
                    id: Uuid::new_v4(),
                    dialect,
                    mode,
                    credentials,
                    name: name.to_string(),
                    color: color.to_string(),
                    schema,
                })
            }
        }
    }
}
