use std::{path::PathBuf, time::Duration};

use deadpool_postgres::{
    Config as PsqlConfig, ManagerConfig as PsqlManagerConfig, RecyclingMethod, SslMode,
};
use deadpool_sqlite::Config as SqliteConfig;
use openssl::ssl::{SslConnector, SslFiletype, SslMethod, SslVerifyMode};
use postgres::NoTls;
use postgres_openssl::MakeTlsConnector;
use sqlx::{
    mysql::{MySqlConnectOptions, MySqlPoolOptions, MySqlSslMode},
    Executor,
};

use crate::{
    engine::types::{
        config::{ConnectionConfig, ConnectionPool, Dialect, Mode},
        connection::InitiatedConnection,
    },
    utils::error::Error,
};

pub async fn init_conn(cfg: ConnectionConfig) -> Result<InitiatedConnection, Error> {
    match &cfg.dialect {
        Dialect::Mysql | Dialect::MariaDB => {
            if cfg.mode == Mode::File {
                return Err(anyhow::anyhow!("File mode is not supported for Mysql").into());
            }
            let mut credentials = cfg.credentials.clone();
            let ssl_keys = vec!["ssl_mode", "ca_cert", "client_key", "client_cert"];
            let mut ssl_cfg = credentials.clone();
            ssl_cfg.retain(|k, _| ssl_keys.contains(&k.as_str()));
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
                return Err(
                    anyhow::anyhow!("client_cert and client_key must be set together").into(),
                );
            }
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
            let schema = options.get_database().unwrap_or("").to_string();
            let pool_opts = MySqlPoolOptions::new()
                .max_connections(10)
                .idle_timeout(Duration::from_secs(30 * 60))
                .max_lifetime(Duration::from_secs(60 * 60))
                .acquire_timeout(Duration::from_secs(10));
            let pool = pool_opts.connect_with(options).await?;
            if pool.execute("SELECT 1").await.is_err() {
                return Err(Error::from(anyhow::anyhow!("Could not connect")));
            }
            Ok(InitiatedConnection {
                config: cfg.clone(),
                pool: ConnectionPool::Mysql(pool),
                schema,
            })
        }
        Dialect::Postgresql => {
            if cfg.mode == Mode::File {
                return Err(anyhow::anyhow!("File mode is not supported for Postgresql").into());
            }
            let mut config = PsqlConfig::new();
            config.user = cfg.credentials.get("user").cloned();
            config.password = cfg.credentials.get("password").cloned();
            config.dbname = cfg.credentials.get("db_name").cloned();
            config.host = cfg.credentials.get("host").cloned();
            config.port = cfg
                .credentials
                .get("port")
                .cloned()
                .map(|p| p.parse::<u16>().expect("Port should be a valid number"));
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
                return Err(
                    anyhow::anyhow!("client_cert and client_key must be set together").into(),
                );
            }

            let pool = match config.ssl_mode {
                Some(mode) => match mode {
                    SslMode::Prefer | SslMode::Require => {
                        if !ca_cert.is_empty() && !client_cert.is_empty() && !client_key.is_empty()
                        {
                            let mut builder = SslConnector::builder(SslMethod::tls_client())?;
                            builder.set_verify(SslVerifyMode::PEER); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                            builder.set_ca_file(ca_cert)?;
                            builder.set_certificate_chain_file(client_cert)?;
                            builder.set_private_key_file(client_key, SslFiletype::PEM)?;
                            let connector = MakeTlsConnector::new(builder.build());
                            Some(config.create_pool(rt, connector)?)
                        } else if !ca_cert.is_empty() {
                            let mut builder = SslConnector::builder(SslMethod::tls_client())?;
                            builder.set_verify(SslVerifyMode::PEER); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                            builder.set_ca_file(
                                cfg.credentials
                                    .get("ca_cert")
                                    .expect("Should have a ca cert"),
                            )?;
                            let connector = MakeTlsConnector::new(builder.build());
                            Some(config.create_pool(rt, connector)?)
                        } else {
                            let mut builder = SslConnector::builder(SslMethod::tls())?;
                            builder.set_verify(SslVerifyMode::NONE); // peer - veirfy ca - must add ca file, none - allow self signed or without ca
                            let connector = MakeTlsConnector::new(builder.build());
                            Some(config.create_pool(rt, connector)?)
                        }
                    }
                    SslMode::Disable => Some(config.create_pool(rt, NoTls)?),
                    _ => None,
                },
                None => None,
            };

            match pool {
                Some(pool) => {
                    let _cfg = config.clone();
                    let conn = pool.get().await?;
                    conn.execute("SELECT 1", &[]).await?;
                    Ok(InitiatedConnection {
                        config: cfg.clone(),
                        pool: ConnectionPool::Postgresql(pool),
                        schema: "public".to_string(),
                    })
                }
                None => Err(anyhow::anyhow!("Cannot create pool").into()),
            }
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
