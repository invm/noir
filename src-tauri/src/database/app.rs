use anyhow::Result;
use rusqlite::Connection;

pub fn create_app_db(app_path: &str) -> Result<()> {
    let conn = Connection::open(app_path)?;

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
