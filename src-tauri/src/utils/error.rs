use serde::Serialize;
// A custom error type that represents all possible in our command
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to read file: {0}")]
    Io(#[from] std::io::Error),
    #[error("File is not valid utf8: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("General error occurred: {0}")]
    General(#[from] anyhow::Error),
    #[error("Uuid parse error")]
    UUIDError(#[from] uuid::Error),
    #[error("Mysql Error: {0}")]
    DBError(#[from] mysql::Error),
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
