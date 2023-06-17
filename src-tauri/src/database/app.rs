use anyhow::Result;
use log::info;
use rusqlite::Connection;

pub fn create_app_db(app_path: &str) -> Result<()> {
    info!("Creating app database at {}", app_path);
    let db_path = format!("{}/.app.db", app_path);
    let conn = Connection::open(db_path)?;

    conn.execute(
        "create table `connections` (
          `id` integer not null primary key autoincrement,
          `name` varchar(255) not null,
          `color` varchar(255) not null,
          `credentials` TEXT not null,
          `default_db` VARCHAR(255) not null,
          `save_password` TINYINT not null,
          `metadata` TEXT null
        )",
        [],
    )?;
    Ok(())
}
