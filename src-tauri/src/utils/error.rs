use serde::Serialize;

// A custom error type that represents all possible in our command
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to read file: {0}")]
    Io(#[from] std::io::Error),
    #[error("File is not valid utf8: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("Uuid parse error")]
    UUID(#[from] uuid::Error),
    #[error("{0}")]
    Sqlx(#[from] sqlx::error::Error),
    #[error("Postgresql error: {0}")]
    Postgresql(#[from] postgres::error::Error),
    #[error("Sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("{0}")]
    DeadpoolSqliteInteract(#[from] deadpool_sqlite::InteractError),
    #[error("{0}")]
    DeadpoolSqlitePool(#[from] deadpool_sqlite::PoolError),
    #[error("Create pool error: {0}")]
    DeadpoolSqliteCreatePool(#[from] deadpool_sqlite::CreatePoolError),
    #[error("{0}")]
    OpenSSLError(#[from] openssl::error::ErrorStack),
    #[error("{0}")]
    DeadpoolPostgresqlPoolError(#[from] deadpool_postgres::PoolError),
    #[error("Create pool error: {0}")]
    DeadpoolPostgresqlCreatePoolError(#[from] deadpool_postgres::CreatePoolError),
    #[error("{0}")]
    SQLParse(#[from] sqlparser::parser::ParserError),
    #[error("Error: {0}")]
    General(#[from] anyhow::Error),
    #[error("Query results expired, please re-run the query.")]
    QueryExpired,
    #[error("{0}")]
    TxError(String),
    #[error("Serdejson error: {0}")]
    SerdeJsonError(#[from] serde_json::Error),
    #[error("Tauri Error: {0}")]
    Tauri(#[from] tauri::Error),
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
