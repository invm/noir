use std::path::PathBuf;

use crate::utils::{
    crypto::{decrypt_data, encrypt_data, get_app_key},
    fs::get_app_path,
};
use anyhow::Result;
use deadpool_sqlite::rusqlite::{named_params, Connection as AppConnection, Error};
use tracing::{error, info};
use uuid::Uuid;

use crate::engine::types::config::{ConnectionConfig, Credentials, Dialect, Mode};

const CURRENT_DB_VERSION: u32 = 1;

/// Initializes the database connection, creating the .sqlite file if needed, and upgrading the database
/// if it's out of date.
pub fn initialize_database() -> Result<AppConnection, Error> {
    let db_path = get_db_path();
    let mut db = AppConnection::open(db_path)?;

    let mut user_pragma = db.prepare("PRAGMA user_version")?;
    let existing_user_version: u32 = user_pragma.query_row([], |row| row.get(0))?;
    drop(user_pragma);

    upgrade_database_if_needed(&mut db, existing_user_version)?;

    Ok(db)
}

/// Upgrades the database to the current version.
pub fn upgrade_database_if_needed(
    db: &mut AppConnection,
    existing_version: u32,
) -> Result<(), Error> {
    if existing_version < CURRENT_DB_VERSION {
        db.pragma_update(None, "journal_mode", "WAL")?;
        let tx = db.transaction()?;
        tx.pragma_update(None, "user_version", CURRENT_DB_VERSION)?;
        tx.commit()?;
    }
    Ok(())
}

pub fn get_db_path() -> PathBuf {
    let app_path = get_app_path();
    PathBuf::from(format!("{}/.app.db", app_path.to_str().unwrap()))
}

pub fn create_app_db() -> Result<()> {
    let db_path = get_db_path();
    info!("Creating app database at {}", db_path.to_str().unwrap());
    let db_path = get_db_path();
    let db = AppConnection::open(db_path)?;

    db.execute(
        "create table `connections` (
          `id` TEXT not null,
          `dialect` varchar(255) not null,
          `mode` varchar(255) not null,
          `credentials` varchar(255) not null,
          `schema` varchar(255) not null,
          `name` varchar(255) not null,
          `color` varchar(255) not null
        )",
        [],
    )?;
    match db.close() {
        Ok(_) => info!("Successfully created app database"),
        Err(e) => error!("Failed to create app database: {:?}", e),
    }
    Ok(())
}

pub fn add_connection(db: &AppConnection, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "INSERT INTO connections (
            id,
            dialect, 
            mode,
            credentials,
            schema,
            name,
            color
            ) VALUES (
                :id,
                :dialect,
                :mode,
                :credentials,
                :schema,
                :name,
                :color
                )",
    )?;
    let credentials = serde_json::to_string(&conn.credentials)?;
    let credentials = encrypt_data(&credentials, &get_app_key()?);
    statement.execute(named_params! {
        ":id": conn.id.to_string(),
        ":dialect": conn.dialect.to_string(),
        ":mode": conn.mode.to_string(),
        ":credentials": credentials,
        ":schema": conn.schema,
        ":name": conn.name,
        ":color": conn.color,
    })?;

    Ok(())
}

pub fn delete_connection(db: &AppConnection, id: &Uuid) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": id.to_string()})?;
    Ok(())
}

pub fn update_connection_schema(db: &AppConnection, id: &str, schema: &str) -> Result<()> {
    let mut statement = db.prepare("UPDATE connections SET schema = :schema where id = :id")?;
    statement.execute(named_params! {":schema": schema, ":id": id})?;
    Ok(())
}

pub fn get_all_connections(db: &AppConnection) -> Result<Vec<ConnectionConfig>> {
    let mut statement = db.prepare("SELECT * FROM connections")?;
    let mut rows = statement.query([])?;
    let mut items = Vec::new();
    let key = get_app_key()?;
    while let Some(row) = rows.next()? {
        let credentials = row.get("credentials")?;
        let data = decrypt_data(&credentials, &key)?;
        let credentials: Credentials = serde_json::from_str(&data)?;
        let dialect: Dialect = row.get("dialect")?;
        let mode: Mode = row.get("mode")?;
        let schema: String = row.get("schema")?;
        let id: String = row.get("id")?;

        items.push(ConnectionConfig {
            id: Uuid::parse_str(&id)?,
            name: row.get("name")?,
            color: row.get("color")?,
            dialect,
            mode,
            credentials,
            schema,
        });
    }

    Ok(items)
}
