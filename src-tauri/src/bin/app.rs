use anyhow::Result;
use deadpool_postgres::{Config, ManagerConfig, RecyclingMethod, SslMode};
use noir::engine::postgresql::query::raw_query;
use openssl::ssl::{SslConnector, SslMethod, SslVerifyMode};
use postgres_openssl::MakeTlsConnector;
use tracing::debug;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    let mut config = Config::new();
    config.user = Some("postgres".to_string());
    config.password = Some("example".to_string());
    config.dbname = Some("dvdrental".to_string());
    config.host = Some("localhost".to_string());
    config.port = Some(5432);
    config.connect_timeout = Some(std::time::Duration::from_secs(15));
    config.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });
    config.ssl_mode = Some(SslMode::Require);

    let mut builder = SslConnector::builder(SslMethod::tls())?;
    builder.set_verify(SslVerifyMode::NONE);
    // builder.set_ca_file("database_cert.pem")?;
    let connector = MakeTlsConnector::new(builder.build());
    let pool = config.create_pool(Some(deadpool_postgres::Runtime::Tokio1), connector)?;
    let query = "select datname, usename, ssl, client_addr from pg_stat_ssl inner join pg_stat_activity on pg_stat_ssl.pid = pg_stat_activity.pid;";
    let result = raw_query(pool, query).await?;
    debug!("result: {:?}", result);

    Ok(())
}
