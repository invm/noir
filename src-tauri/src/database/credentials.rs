use serde::{Deserialize, Serialize};

pub struct DSN {}

#[derive(Debug, Serialize, Deserialize)]
pub struct Credentials {
    pub scheme: String,
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u16,
    pub dbname: String,
    pub params: Option<Vec<String>>,
}

pub struct Connection {
    pub id: u32,
    pub name: String,
    pub color: String,
    pub credentials: DSN,
    pub default_db: String,
    pub save_password: bool,
    pub metadata: Option<String>,
}
