use anyhow::Result;
use rusqlite::{named_params, Connection};
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Deserialize)]
pub struct DBConnection {
    pub id: u32,
    pub name: String,
    pub color: String,
    pub credentials: Credentials,
    pub default_db: String,
    pub save_password: bool,
    pub metadata: Option<String>,
}

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

pub fn update_connection(db: &Connection, conn: &DBConnection) -> Result<()> {
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

pub fn delete_connection(db: &Connection, conn: &DBConnection) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": conn.id})?;

    Ok(())
}

pub fn get_all_connections(
    db: &Connection,
    limit: usize,
    offset: usize,
) -> Result<Vec<DBConnection>> {
    let mut statement = db.prepare("SELECT * FROM connections LIMIT ? OFFSET ?")?;
    let mut rows = statement.query([limit, offset])?;
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

pub fn get_connection_by_id(db: &Connection, id: u32) -> Result<DBConnection> {
    let mut statement = db.prepare("SELECT * FROM connections WHERE id = ?")?;
    let mut rows = statement.query([id])?;
    let row = rows.next()?;
    let row = row.ok_or(anyhow::anyhow!("No connection found"))?;
    let credentials: String = row.get("credentials")?;
    let credentials: Credentials = serde_json::from_str(&credentials)?;
    let metadata: String = row.get("metadata")?;
    let metadata: Option<String> = serde_json::from_str(&metadata).ok();

    return Ok(DBConnection {
        id: row.get("id")?,
        name: row.get("name")?,
        color: row.get("color")?,
        credentials,
        default_db: row.get("default_db")?,
        save_password: row.get("save_password")?,
        metadata,
    });
}
