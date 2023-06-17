use crate::{database::queries, state};
use anyhow::Result;
use serde::{Deserialize, Serialize};

use state::ServiceAccess;
use tauri::AppHandle;

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

pub struct DBConnection {
    pub id: u32,
    pub name: String,
    pub color: String,
    pub credentials: Credentials,
    pub default_db: String,
    pub save_password: bool,
    pub metadata: Option<String>,
}

pub fn add_connection(app_handle: AppHandle, conn: DBConnection) -> Result<()> {
    return app_handle.db(|db| queries::add_connection(&conn, db));
}

pub fn get_all_connections(app_handle: AppHandle) -> Result<Vec<DBConnection>> {
    return app_handle.db(|db| queries::get_all_connections(db));
}
