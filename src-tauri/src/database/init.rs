use crate::utils::fs::get_db_path;
use deadpool_sqlite::rusqlite::{Connection as AppConnection, Error};
use include_dir::{include_dir, Dir};
use lazy_static::lazy_static;
use rusqlite_migration::Migrations;
use log::error;

static MIGRATIONS_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/src/database/migrations");

// Define migrations. These are applied atomically.
lazy_static! {
    static ref MIGRATIONS: Migrations<'static> =
        Migrations::from_directory(&MIGRATIONS_DIR).expect("Failed to load migrations");
}

/// Initializes the database connection, creating the .sqlite file if needed, and upgrading the database
/// if it's out of date.
pub fn initialize_database() -> Result<AppConnection, Error> {
    let db_path = get_db_path();
    let mut db = AppConnection::open(db_path)?;

    let _ = MIGRATIONS.to_latest(&mut db).map_err(|e| {
        error!("Error applying migrations: {:?}", e);
    });

    Ok(db)
}
