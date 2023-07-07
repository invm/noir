use crate::utils::fs::get_app_path;
use anyhow::Result;
use log::info;
use rusqlite::Connection;

const CURRENT_DB_VERSION: u32 = 1;

/// Initializes the database connection, creating the .sqlite file if needed, and upgrading the database
/// if it's out of date.
pub fn initialize_database() -> Result<Connection, rusqlite::Error> {
    let db_path = get_db_path();
    let mut db = Connection::open(db_path)?;

    let mut user_pragma = db.prepare("PRAGMA user_version")?;
    let existing_user_version: u32 = user_pragma.query_row([], |row| row.get(0))?;
    drop(user_pragma);

    upgrade_database_if_needed(&mut db, existing_user_version)?;

    Ok(db)
}

/// Upgrades the database to the current version.
pub fn upgrade_database_if_needed(
    db: &mut Connection,
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
    let app_path = get_app_path();
    format!("{}/.app.db", app_path)
}

pub fn create_app_db(app_path: &str) -> Result<()> {
    info!("Creating app database at {}", app_path);
    let db_path = get_db_path();
    let db = Connection::open(db_path)?;

    db.execute(
        "create table `connections` (
          `id`TEXT not null,
          `scheme` TEXT not null,
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
