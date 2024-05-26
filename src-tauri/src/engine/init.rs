use anyhow::{anyhow, Result};
use std::{path::PathBuf, time::Duration};

use deadpool_postgres::{
    Config as PsqlConfig, ManagerConfig as PsqlManagerConfig, Pool, RecyclingMethod, SslMode,
};
use deadpool_sqlite::Config as SqliteConfig;
use openssl::ssl::{SslConnector, SslFiletype, SslMethod, SslVerifyMode};
use postgres::NoTls;
use postgres_openssl::MakeTlsConnector;
use sqlx::{
    mysql::{MySqlConnectOptions, MySqlPoolOptions, MySqlSslMode},
    pool::PoolOptions,
    Executor,
};
use tauri::AppHandle;

use crate::{
    engine::types::{
        config::{ConnectionConfig, ConnectionPool, Dialect, Mode},
        connection::InitiatedConnection,
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
            let conn = pool.get().await?;
            conn.execute("SELECT 1", &[]).await?;
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
            let config = SqliteConfig::new(PathBuf::from(path.clone()));
            match config.create_pool(deadpool_sqlite::Runtime::Tokio1) {
                Ok(pool) => match pool.get().await {
                    Ok(_) => {
                        let conn = pool.get().await?;
                        let _ = conn.interact(|c| c.execute("SELECT 1", [])).await?;
                        Ok(InitiatedConnection {
                            config: cfg.clone(),
                            pool: ConnectionPool::Sqlite(pool),
                            schema: path.to_string(),
                        })
                    }
                    Err(e) => Err(Error::DeadpoolSqlitePool(e)),
                },
                Err(e) => Err(Error::DeadpoolSqliteCreatePool(e)),
            }
        }
    }
}

fn create_psql_pool(config: PsqlConfig, cfg: ConnectionConfig) -> Result<Pool> {
    let rt = Some(deadpool_postgres::Runtime::Tokio1);
    let ca_cert = cfg
        .credentials
        .get("ca_cert")
        .cloned()
        .unwrap_or("".to_string());
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
    Ok(
        if let Some(SslMode::Prefer | SslMode::Require) = config.ssl_mode {
            if !ca_cert.is_empty() && !client_cert.is_empty() && !client_key.is_empty() {
                let mut builder = SslConnector::builder(SslMethod::tls_client())?;
                builder.set_verify(SslVerifyMode::PEER); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                builder.set_ca_file(ca_cert)?;
                builder.set_certificate_chain_file(client_cert)?;
                builder.set_private_key_file(client_key, SslFiletype::PEM)?;
                config.create_pool(rt, MakeTlsConnector::new(builder.build()))?
            } else if !ca_cert.is_empty() {
                let mut builder = SslConnector::builder(SslMethod::tls_client())?;
                builder.set_verify(SslVerifyMode::PEER); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                builder.set_ca_file(
                    cfg.credentials
                        .get("ca_cert")
                        .expect("Should have a ca cert"),
                )?;
                config.create_pool(rt, MakeTlsConnector::new(builder.build()))?
            } else {
                let mut builder = SslConnector::builder(SslMethod::tls())?;
                builder.set_verify(SslVerifyMode::NONE); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                let connector = MakeTlsConnector::new(builder.build());
                config.create_pool(rt, connector)?
            }
        } else {
            config.create_pool(rt, NoTls)?
        },
    )
}

async fn build_psql_pool(cfg: ConnectionConfig, app_handle: AppHandle) -> Result<Pool> {
    if cfg.mode == Mode::File {
        return Err(anyhow::anyhow!("File mode is not supported for Postgresql"));
    }
    let mut config = PsqlConfig::new();
    config.user = cfg.credentials.get("user").cloned();
    config.password = cfg.credentials.get("password").cloned();
    config.dbname = cfg.credentials.get("db_name").cloned();
    config.connect_timeout = Some(std::time::Duration::from_secs(15));
    config.manager = Some(PsqlManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });
    let ssl_mode = cfg.credentials.get("ssl_mode");
    config.ssl_mode = match ssl_mode {
        Some(val) => match val.as_str() {
            "prefer" => Some(SslMode::Prefer),
            "require" => Some(SslMode::Require),
            _ => Some(SslMode::Disable),
        },
        None => Some(SslMode::Disable),
    };

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
            config.host = Some("127.0.0.1".to_string());
            config.port = Some(available_port);
            Ok(create_psql_pool(config, cfg)?)
        }
        Mode::File => Err(anyhow!("Should never reach here")),
        _ => {
            config.host = cfg.credentials.get("host").cloned();
            config.port = cfg
                .credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"));
            Ok(create_psql_pool(config, cfg)?)
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
                options = options.ssl_client_cert(client_key);
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
                options = options.ssl_client_cert(client_key);
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
