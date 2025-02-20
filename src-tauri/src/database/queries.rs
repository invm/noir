use crate::utils::crypto::{decrypt_data, encrypt_data, get_app_key};
use anyhow::Result;
use deadpool_sqlite::rusqlite::{named_params, Connection as AppConnection};
use rusqlite::params;
use uuid::Uuid;

use crate::engine::types::config::{ConnectionConfig, Credentials, Dialect, Metadata, Mode};

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

pub fn update_connection(db: &AppConnection, id: String, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "UPDATE connections
        SET
            dialect = :dialect,
            mode = :mode,
            credentials = :credentials,
            schema = :schema,
            name = :name,
            color = :color,
            metadata = :metadata
        WHERE
            id = :id;",
    )?;

    let credentials = serde_json::to_string(&conn.credentials)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    let credentials = encrypt_data(&credentials, &get_app_key()?);
    statement.execute(named_params! {
        ":id": id.to_string(),
        ":dialect": conn.dialect.to_string(),
        ":mode": conn.mode.to_string(),
        ":credentials": credentials,
        ":schema": conn.schema,
        ":name": conn.name,
        ":color": conn.color,
        ":metadata": metadata,
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
        let credentials: String = row.get("credentials")?;
        let data = decrypt_data(&credentials, &key)?;
        let credentials: Credentials = serde_json::from_str(&data)?;
        let metadata: String = row.get("metadata")?;
        let metadata: Metadata = serde_json::from_str(&metadata).unwrap_or_default();
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
            metadata,
            schema,
        });
    }

    Ok(items)
}

pub fn get_connection(db: &AppConnection, id: &str) -> Result<ConnectionConfig> {
    let mut statement = db.prepare("SELECT * FROM connections where id = ?1")?;
    let mut rows = statement.query(params![id])?;
    let mut items = Vec::new();
    let key = get_app_key()?;
    while let Some(row) = rows.next()? {
        let credentials: String = row.get("credentials")?;
        let data = decrypt_data(&credentials, &key)?;
        let credentials: Credentials = serde_json::from_str(&data)?;
        let metadata: String = row.get("metadata")?;
        let metadata: Metadata = serde_json::from_str(&metadata).unwrap_or_default();
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
            metadata,
        });
    }
    if items.is_empty() {
        return Err(anyhow::anyhow!("Connection not found"));
    }

    Ok(items[0].clone())
}
