use serde::Serialize;

use crate::queues::query::QueryTask;
// A custom error type that represents all possible in our command
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to read file: {0}")]
    Io(#[from] std::io::Error),
    #[error("File is not valid utf8: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("Uuid parse error")]
    UUID(#[from] uuid::Error),
    #[error("Queue send error: {0}")]
    Send(#[from] tokio::sync::mpsc::error::SendError<QueryTask>),
    #[error("{0}")]
    Mysql(#[from] mysql::Error),
    #[error("Mysql error: {0}")]
    MysqlError(#[from] mysql::MySqlError),
    #[error("Mysql url error: {0}")]
    MysqlUrlError(#[from] mysql::UrlError),
    #[error("Postgresql error: {0}")]
    Postgresql(#[from] postgres::error::Error),
    #[error("Pool error: {0}")]
    DeadpoolPostgresqlPoolError(#[from] deadpool_postgres::PoolError),
    #[error("Create pool error: {0}")]
    DeadpoolPostgresqlCreatePoolError(#[from] deadpool_postgres::CreatePoolError),
    #[error("{0}")]
    SQLParse(#[from] sqlparser::parser::ParserError),
    #[error("General error occurred: {0}")]
    General(#[from] anyhow::Error),
    #[error("Query results expired, please re-run the query.")]
    QueryExpired,
    #[error("{0}")]
    TxError(String),
    #[error("Serdejson error: {0}")]
    SerdeJsonError(#[from] serde_json::Error),
}

// we must also implement serde::Serialize
impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type CommandResult<T, E = Error> = anyhow::Result<T, E>;
