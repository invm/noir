use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DSN {
    pub scheme: String,
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u8,
    pub dbname: String,
    pub params: Vec<String>,
}

pub struct Connection {
    pub name: String,
    pub color: String,
    pub credentials: DSN,
    pub default_db: String,
    pub save_password: bool,
}
