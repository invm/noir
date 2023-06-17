use anyhow::Result;
use rusqlite::{named_params, Connection};

use crate::methods::connections::{Credentials, DBConnection};

pub fn add_connection(conn: &DBConnection, db: &Connection) -> Result<()> {
    let mut statement = db.prepare("INSERT INTO connections (name, color, credentials, default_db, save_password, metadata) VALUES (:name, :color, :credentials, :default_db, :save_password, :metadata)")?;
    let credentials = serde_json::to_string(&conn.credentials)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    statement.execute(named_params! {
        ":name": conn.name,
        ":color": conn.color,
        ":credentials": credentials,
        ":default_db": conn.default_db,
        ":save_password": conn.save_password,
        ":metadata": metadata,
    })?;

    Ok(())
}

pub fn update_connection(conn: &DBConnection, db: &Connection) -> Result<()> {
    let mut statement = db.prepare("INSERT INTO connections (name, color, credentials, default_db, save_password, metadata) VALUES (:name, :color, :credentials, :default_db, :save_password, :metadata) where id = :id")?;
    let credentials = serde_json::to_string(&conn.credentials)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    statement.execute(named_params! {
        ":name": conn.name,
        ":color": conn.color,
        ":credentials": credentials,
        ":default_db": conn.default_db,
        ":save_password": conn.save_password,
        ":metadata": metadata,
        ":id": conn.id,
    })?;

    Ok(())
}

pub fn delete_connection(conn: &DBConnection, db: &Connection) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": conn.id})?;

    Ok(())
}

pub fn get_all_connections(db: &Connection) -> Result<Vec<DBConnection>> {
    let mut statement = db.prepare("SELECT * FROM connections")?;
    let mut rows = statement.query([])?;
    let mut items = Vec::new();
    while let Some(row) = rows.next()? {
        let credentials: String = row.get("credentials")?;
        let credentials: Credentials = serde_json::from_str(&credentials)?;
        let metadata: String = row.get("metadata")?;
        let metadata: Option<String> = serde_json::from_str(&metadata).ok();

        items.push(DBConnection {
            id: row.get("id")?,
            name: row.get("name")?,
            color: row.get("color")?,
            credentials,
            default_db: row.get("default_db")?,
            save_password: row.get("save_password")?,
            metadata,
        });
    }

    Ok(items)
}
