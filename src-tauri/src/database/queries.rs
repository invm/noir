use crate::utils::fs::get_app_path;
use anyhow::Result;
use rusqlite::{named_params, Connection as AppConnection};
use tracing::info;
use uuid::Uuid;

use super::connections::{ConnectionConfig, Credentials, Dialect, Mode};

const CURRENT_DB_VERSION: u32 = 1;

/// Initializes the database connection, creating the .sqlite file if needed, and upgrading the database
/// if it's out of date.
pub fn initialize_database() -> Result<AppConnection, rusqlite::Error> {
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
) -> Result<(), rusqlite::Error> {
    if existing_version < CURRENT_DB_VERSION {
        db.pragma_update(None, "journal_mode", "WAL")?;
        let tx = db.transaction()?;
        tx.pragma_update(None, "user_version", CURRENT_DB_VERSION)?;
        tx.commit()?;
    }
    Ok(())
}

pub fn get_db_path() -> String {
    // TODO: check what tauri provides for this
    let app_path = get_app_path();
    format!("{}/.app.db", app_path)
}

pub fn create_app_db(app_path: &str) -> Result<()> {
    info!("Creating app database at {}", app_path);
    let db_path = get_db_path();
    let db = AppConnection::open(db_path)?;

    db.execute(
        "create table `connections` (
          `id`TEXT not null,
          `dialect` varchar(255) not null,
          `mode` varchar(255) not null,
          `credentials` varchar(255) not null,
          `name` varchar(255) not null,
          `color` varchar(255) not null
        )",
        [],
    )?;
    match db.close() {
        Ok(_) => info!("Successfully created app database"),
        Err(e) => info!("Failed to create app database: {:?}", e),
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
            name,
            color
            ) VALUES (
                :id,
                :dialect,
                :mode,
                :credentials,
                :name,
                :color
                )",
    )?;
    let credentials = serde_json::to_string(&conn.credentials)?;
    statement.execute(named_params! {
        ":id": conn.id,
        ":dialect": conn.dialect.to_string(),
        ":mode": conn.mode.to_string(),
        ":credentials": credentials,
        ":name": conn.name,
        ":color": conn.color,
    })?;

    Ok(())
}

pub fn delete_connection(db: &AppConnection, id: &Uuid) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": id})?;
    Ok(())
}

pub fn get_all_connections(db: &AppConnection) -> Result<Vec<ConnectionConfig>> {
    let mut statement = db.prepare("SELECT * FROM connections")?;
    let mut rows = statement.query([])?;
    let mut items = Vec::new();
    while let Some(row) = rows.next()? {
        let credentials: String = row.get("credentials")?;
        let credentials: Credentials = serde_json::from_str(&credentials)?;
        let dialect: Dialect = row.get("dialect")?;
        let mode: Mode = row.get("mode")?;

        items.push(ConnectionConfig {
            id: row.get("id")?,
            name: row.get("name")?,
            color: row.get("color")?,
            dialect,
            mode,
            credentials,
        });
    }

    Ok(items)
}
