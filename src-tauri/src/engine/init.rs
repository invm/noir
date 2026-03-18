use anyhow::{anyhow, Result};
use std::time::Duration;

use sqlx::{
    mysql::{MySqlConnectOptions, MySqlPoolOptions, MySqlSslMode},
    pool::PoolOptions,
    postgres::{PgConnectOptions, PgPoolOptions, PgSslMode},
    Executor,
};
use tauri::AppHandle;

use crate::{
    engine::{
        clickhouse::client::ClickHouseClient,
        types::{
            config::{ConnectionConfig, ConnectionPool, Dialect, Mode},
            connection::InitiatedConnection,
        },
    },
    state::ServiceAccess,
    utils::{
        error::Error,
        general::{get_available_port, request_port_forward},
    },
};

pub async fn init_conn(
    cfg: ConnectionConfig,
    app_handle: AppHandle,
) -> Result<InitiatedConnection, Error> {
    match &cfg.dialect {
        Dialect::Mysql | Dialect::MariaDB => {
            let (pool_opts, options) =
                build_mysql_pool_opts(cfg.clone(), app_handle.clone()).await?;
            let schema = options.get_database().unwrap_or("").to_string();
            let pool = pool_opts.connect_with(options).await?;
            if pool.execute("SELECT 1").await.is_err() {
                app_handle.cancel_token(cfg.id.to_string()).await?;
                return Err(Error::from(anyhow::anyhow!("Could not connect")));
            }
            Ok(InitiatedConnection {
                config: cfg.clone(),
                pool: ConnectionPool::Mysql(pool),
                schema,
            })
        }
        Dialect::Postgresql => {
            let _cfg = cfg.clone();
            let pool = build_psql_pool(cfg, app_handle).await?;
            sqlx::query("SELECT 1").execute(&pool).await?;
            Ok(InitiatedConnection {
                config: _cfg,
                pool: ConnectionPool::Postgresql(pool),
                schema: "public".to_string(),
            })
        }
        Dialect::Sqlite => {
            if cfg.mode != Mode::File {
                return Err(anyhow::anyhow!("Only file mode is supported for Sqlite").into());
            }
            let path = cfg
                .credentials
                .get("path")
                .cloned()
                .unwrap_or("".to_string());
            let options = sqlx::sqlite::SqliteConnectOptions::new()
                .filename(&path)
                .read_only(false)
                .create_if_missing(false);
            let pool = sqlx::SqlitePool::connect_with(options).await?;
            sqlx::query("SELECT 1").execute(&pool).await?;
            Ok(InitiatedConnection {
                config: cfg.clone(),
                pool: ConnectionPool::Sqlite(pool),
                schema: path.to_string(),
            })
        }
        Dialect::ClickHouse => {
            if cfg.mode == Mode::File || cfg.mode == Mode::Socket {
                return Err(
                    anyhow::anyhow!("Only Host and SSH modes are supported for ClickHouse").into(),
                );
            }
            let empty = String::new();
            let user = cfg.credentials.get("user").unwrap_or(&empty);
            let password = cfg.credentials.get("password").unwrap_or(&empty);
            let database = cfg
                .credentials
                .get("db_name")
                .cloned()
                .unwrap_or("default".to_string());

            let (host, port) = match cfg.mode {
                Mode::Ssh => {
                    let ssh_keys = ["ssh_host", "ssh_port", "ssh_user", "ssh_key"];
                    let mut ssh_cfg = cfg.credentials.clone();
                    ssh_cfg.retain(|k, _| ssh_keys.contains(&k.as_str()));
                    let available_port = get_available_port();
                    let remote_host = cfg.credentials.get("host").unwrap_or(&empty).to_string();
                    let remote_port = cfg
                        .credentials
                        .get("port")
                        .cloned()
                        .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                        .unwrap_or(8123);
                    request_port_forward(
                        app_handle.clone(),
                        cfg.id.to_string(),
                        available_port,
                        remote_host,
                        remote_port.to_string(),
                        ssh_cfg,
                    )
                    .await?;
                    ("127.0.0.1".to_string(), available_port)
                }
                _ => {
                    let host = cfg
                        .credentials
                        .get("host")
                        .cloned()
                        .unwrap_or("localhost".to_string());
                    let port = cfg
                        .credentials
                        .get("port")
                        .cloned()
                        .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                        .unwrap_or(8123);
                    (host, port)
                }
            };

            let client = ClickHouseClient::new(&host, port, user, password, &database)?;
            if client.ping().await.is_err() {
                app_handle.cancel_token(cfg.id.to_string()).await?;
                return Err(Error::from(anyhow::anyhow!("Could not connect to ClickHouse")));
            }
            Ok(InitiatedConnection {
                config: cfg.clone(),
                pool: ConnectionPool::ClickHouse(client),
                schema: database,
            })
        }
    }
}

async fn build_psql_opts(
    cfg: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<PgConnectOptions> {
    let empty = String::new();
    let mut options = PgConnectOptions::new()
        .host(host)
        .port(port)
        .username(cfg.credentials.get("user").unwrap_or(&empty))
        .password(cfg.credentials.get("password").unwrap_or(&empty))
        .database(cfg.credentials.get("db_name").unwrap_or(&empty));

    let ssl_mode = cfg.credentials.get("ssl_mode");
    options = match ssl_mode.map(|s| s.as_str()) {
        Some("prefer") => options.ssl_mode(PgSslMode::Prefer),
        Some("require") => options.ssl_mode(PgSslMode::Require),
        _ => options.ssl_mode(PgSslMode::Disable),
    };

    let ca_cert = cfg.credentials.get("ca_cert").cloned().unwrap_or_default();
    let client_cert = cfg
        .credentials
        .get("client_cert")
        .cloned()
        .unwrap_or_default();
    let client_key = cfg
        .credentials
        .get("client_key")
        .cloned()
        .unwrap_or_default();

    if (!client_cert.is_empty() && client_key.is_empty())
        || (client_cert.is_empty() && !client_key.is_empty())
    {
        return Err(anyhow::anyhow!(
            "client_cert and client_key must be set together"
        ));
    }

    if !ca_cert.is_empty() {
        options = options.ssl_root_cert(ca_cert);
    }
    if !client_cert.is_empty() {
        options = options.ssl_client_cert(client_cert);
        options = options.ssl_client_key(client_key);
    }

    Ok(options)
}

async fn build_psql_pool(
    cfg: ConnectionConfig,
    app_handle: AppHandle,
) -> Result<sqlx::PgPool> {
    if cfg.mode == Mode::File {
        return Err(anyhow::anyhow!("File mode is not supported for Postgresql"));
    }

    let pool_opts = PgPoolOptions::new()
        .max_connections(10)
        .idle_timeout(Duration::from_secs(30 * 60))
        .max_lifetime(Duration::from_secs(60 * 60))
        .acquire_timeout(Duration::from_secs(15));

    match cfg.mode {
        Mode::Ssh => {
            let ssh_keys = ["ssh_host", "ssh_port", "ssh_user", "ssh_key"];
            let mut ssh_cfg = cfg.credentials.clone();
            ssh_cfg.retain(|k, _| ssh_keys.contains(&k.as_str()));
            let empty_str = String::default();
            let available_port = get_available_port();
            let host = cfg.credentials.get("host").unwrap_or(&empty_str);
            let port = cfg
                .credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                .unwrap_or(5432);
            request_port_forward(
                app_handle.clone(),
                cfg.id.to_string(),
                available_port,
                host.to_string(),
                port.to_string(),
                ssh_cfg,
            )
            .await?;
            let options = build_psql_opts(&cfg, "127.0.0.1", available_port).await?;
            Ok(pool_opts.connect_with(options).await?)
        }
        Mode::File => Err(anyhow!("Should never reach here")),
        _ => {
            let empty_str = String::default();
            let host = cfg
                .credentials
                .get("host")
                .unwrap_or(&empty_str);
            let port = cfg
                .credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                .unwrap_or(5432);
            let options = build_psql_opts(&cfg, host, port).await?;
            Ok(pool_opts.connect_with(options).await?)
        }
    }
}

async fn build_mysql_pool_opts(
    cfg: ConnectionConfig,
    app_handle: AppHandle,
) -> Result<(PoolOptions<sqlx::MySql>, MySqlConnectOptions)> {
    if cfg.mode == Mode::File {
        return Err(anyhow::anyhow!("File mode is not supported for Mysql"));
    }
    let mut credentials = cfg.credentials.clone();
    let ssl_keys = vec!["ssl_mode", "ca_cert", "client_key", "client_cert"];
    let mut ssl_cfg = credentials.clone();
    ssl_cfg.retain(|k, _| ssl_keys.contains(&k.as_str()));
    let ssh_keys = ["ssh_host", "ssh_port", "ssh_user", "ssh_key"];
    let mut ssh_cfg = credentials.clone();
    ssh_cfg.retain(|k, _| ssh_keys.contains(&k.as_str()));
    for key in ssl_keys {
        credentials.remove(key);
    }
    let ca_cert = ssl_cfg.get("ca_cert").cloned().unwrap_or("".to_string());
    let client_cert = cfg
        .credentials
        .get("client_cert")
        .cloned()
        .unwrap_or("".to_string());
    let client_key = cfg
        .credentials
        .get("client_key")
        .cloned()
        .unwrap_or("".to_string());
    if (!client_cert.is_empty() && client_key.is_empty())
        || (client_cert.is_empty() && !client_key.is_empty())
    {
        return Err(anyhow::anyhow!(
            "client_cert and client_key must be set together"
        ));
    }
    let options = match cfg.mode {
        Mode::Host => {
            let port = credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                .unwrap_or(3306);
            let mut options = MySqlConnectOptions::new()
                .host(credentials.get("host").unwrap_or(&"".to_string()))
                .username(credentials.get("user").unwrap_or(&"".to_string()))
                .password(credentials.get("password").unwrap_or(&"".to_string()))
                .database(credentials.get("db_name").unwrap_or(&"".to_string()))
                .port(port);
            let ssl_mode = cfg.credentials.get("ssl_mode");
            if let Some(ssl_mode) = ssl_mode {
                options = match ssl_mode.as_str() {
                    "prefer" => options.ssl_mode(MySqlSslMode::Preferred),
                    "require" => options.ssl_mode(MySqlSslMode::Required),
                    _ => options.ssl_mode(MySqlSslMode::Disabled),
                };
            }
            if !ca_cert.is_empty() {
                options = options.ssl_ca(ca_cert);
            }
            if !client_cert.is_empty() {
                options = options.ssl_client_cert(client_cert);
                options = options.ssl_client_key(client_key);
            }
            options
        }
        Mode::Socket => MySqlConnectOptions::new()
            .socket(credentials.get("socket").unwrap_or(&"".to_string()))
            .username(credentials.get("user").unwrap_or(&"".to_string()))
            .password(credentials.get("password").unwrap_or(&"".to_string()))
            .database(credentials.get("db_name").unwrap_or(&"".to_string())),
        Mode::Ssh => {
            let empty_str = String::default();
            let available_port = get_available_port();
            let host = credentials.get("host").unwrap_or(&empty_str);
            let port = credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"))
                .unwrap_or(3306);
            let mut options = MySqlConnectOptions::new()
                .host("127.0.0.1")
                .username(credentials.get("user").unwrap_or(&"".to_string()))
                .password(credentials.get("password").unwrap_or(&"".to_string()))
                .database(credentials.get("db_name").unwrap_or(&"".to_string()))
                .port(available_port);
            let ssl_mode = cfg.credentials.get("ssl_mode");
            if let Some(ssl_mode) = ssl_mode {
                options = match ssl_mode.as_str() {
                    "prefer" => options.ssl_mode(MySqlSslMode::Preferred),
                    "require" => options.ssl_mode(MySqlSslMode::Required),
                    _ => options.ssl_mode(MySqlSslMode::Disabled),
                };
            }
            if !ca_cert.is_empty() {
                options = options.ssl_ca(ca_cert);
            }
            if !client_cert.is_empty() {
                options = options.ssl_client_cert(client_cert);
                options = options.ssl_client_key(client_key);
            }
            request_port_forward(
                app_handle.clone(),
                cfg.id.to_string(),
                available_port,
                host.to_string(),
                port.to_string(),
                ssh_cfg,
            )
            .await?;
            options
        }
        _ => MySqlConnectOptions::new(),
    };
    let pool_opts = MySqlPoolOptions::new()
        .max_connections(10)
        .idle_timeout(Duration::from_secs(30 * 60))
        .max_lifetime(Duration::from_secs(60 * 60))
        .acquire_timeout(Duration::from_secs(10));
    Ok((pool_opts, options))
}
