use std::path::PathBuf;

use deadpool_postgres::{
    Config as PsqlConfig, ManagerConfig as PsqlManagerConfig, RecyclingMethod,
};
use deadpool_sqlite::Config as SqliteConfig;
use mysql::{Opts, OptsBuilder, Pool as MysqlPool};
use postgres::NoTls;

use crate::{
    engine::types::{
        config::{ConnectionConfig, ConnectionOpts, ConnectionPool, Dialect, Mode},
        connection::InitiatedConnection,
    },
    utils::error::Error,
};

pub async fn init_conn(cfg: ConnectionConfig) -> Result<InitiatedConnection, Error> {
    match &cfg.dialect {
        Dialect::Mysql => {
            if cfg.mode == Mode::File {
                return Err(anyhow::anyhow!("File mode is not supported for Mysql").into());
            }
            let builder = OptsBuilder::new();
            let builder = builder
                .from_hash_map(&cfg.credentials)?
                .tcp_connect_timeout(Some(std::time::Duration::from_secs(15)))
                .prefer_socket(cfg.mode == Mode::Socket);
            let opts = Opts::from(builder);
            let cloned = opts.clone();
            match MysqlPool::new(opts.clone()) {
                Ok(pool) => {
                    let schema = cloned.get_db_name().unwrap_or("");
                    Ok(InitiatedConnection {
                        config: cfg.clone(),
                        pool: ConnectionPool::Mysql(pool),
                        opts: ConnectionOpts::Mysql(opts),
                        schema: schema.to_string(),
                    })
                }
                Err(e) => Err(Error::Mysql(e)),
            }
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
            match config.create_pool(Some(deadpool_postgres::Runtime::Tokio1), NoTls) {
                // in case of sockets, the url should be percent-encoded
                Ok(pool) => {
                    let _cfg = config.clone();
                    match pool.get().await {
                        Ok(_) => Ok(InitiatedConnection {
                            config: cfg.clone(),
                            pool: ConnectionPool::Postgresql(pool),
                            opts: ConnectionOpts::Postgresql(_cfg),
                            schema: "public".to_string(),
                        }),
                        Err(e) => Err(Error::DeadpoolPostgresqlPoolError(e)),
                    }
                }
                Err(e) => Err(Error::DeadpoolPostgresqlCreatePoolError(e)),
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
                    Ok(_) => Ok(InitiatedConnection {
                        config: cfg.clone(),
                        pool: ConnectionPool::Sqlite(pool),
                        opts: ConnectionOpts::Sqlite(config),
                        schema: path.to_string(),
                    }),
                    Err(e) => Err(Error::DeadpoolSqlitePool(e)),
                },
                Err(e) => Err(Error::DeadpoolSqliteCreatePool(e)),
            }
        }
    }
}
