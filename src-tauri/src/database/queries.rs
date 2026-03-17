use crate::utils::crypto::{decrypt_data, encrypt_data};
use anyhow::Result;
use magic_crypt::MagicCrypt256;
use sqlx::sqlite::SqlitePool;
use sqlx::Row;
use uuid::Uuid;

use crate::engine::types::config::{ConnectionConfig, Credentials, Dialect, Metadata, Mode};

pub async fn add_connection(
    pool: &SqlitePool,
    conn: &ConnectionConfig,
    key: MagicCrypt256,
) -> Result<()> {
    let credentials = serde_json::to_string(&conn.credentials)?;
    let credentials = encrypt_data(&credentials, &key);
    let id = conn.id.to_string();
    let dialect = conn.dialect.to_string();
    let mode = conn.mode.to_string();

    sqlx::query(
        "INSERT INTO connections (id, dialect, mode, credentials, schema, name, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(&id)
    .bind(&dialect)
    .bind(&mode)
    .bind(&credentials)
    .bind(&conn.schema)
    .bind(&conn.name)
    .bind(&conn.color)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn update_connection(
    pool: &SqlitePool,
    id: String,
    conn: &ConnectionConfig,
    key: MagicCrypt256,
) -> Result<()> {
    let credentials = serde_json::to_string(&conn.credentials)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    let credentials = encrypt_data(&credentials, &key);
    let dialect = conn.dialect.to_string();
    let mode = conn.mode.to_string();

    sqlx::query(
        "UPDATE connections
         SET dialect = $1, mode = $2, credentials = $3, schema = $4, name = $5, color = $6, metadata = $7
         WHERE id = $8",
    )
    .bind(&dialect)
    .bind(&mode)
    .bind(&credentials)
    .bind(&conn.schema)
    .bind(&conn.name)
    .bind(&conn.color)
    .bind(&metadata)
    .bind(&id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn delete_connection(pool: &SqlitePool, id: &Uuid) -> Result<()> {
    sqlx::query("DELETE FROM connections WHERE id = $1")
        .bind(id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_connection_schema(
    pool: &SqlitePool,
    id: &str,
    schema: &str,
) -> Result<()> {
    sqlx::query("UPDATE connections SET schema = $1 WHERE id = $2")
        .bind(schema)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_all_connections(
    pool: &SqlitePool,
    key: MagicCrypt256,
) -> Result<Vec<ConnectionConfig>> {
    let rows = sqlx::query("SELECT * FROM connections")
        .fetch_all(pool)
        .await?;

    let mut items = Vec::new();
    for row in rows {
        let credentials: String = row.get("credentials");
        let data = decrypt_data(&credentials, &key)?;
        let credentials: Credentials = serde_json::from_str(&data)?;
        let metadata_str: String = row.get("metadata");
        let metadata: Metadata = serde_json::from_str(&metadata_str).unwrap_or_default();
        let dialect_str: String = row.get("dialect");
        let dialect: Dialect = dialect_str.parse()?;
        let mode_str: String = row.get("mode");
        let mode: Mode = mode_str.parse()?;
        let schema: String = row.get("schema");
        let id: String = row.get("id");

        items.push(ConnectionConfig {
            id: Uuid::parse_str(&id)?,
            name: row.get("name"),
            color: row.get("color"),
            dialect,
            mode,
            credentials,
            metadata,
            schema,
        });
    }

    Ok(items)
}

pub async fn get_connection(
    pool: &SqlitePool,
    id: &str,
    key: &MagicCrypt256,
) -> Result<ConnectionConfig> {
    let rows = sqlx::query("SELECT * FROM connections WHERE id = $1")
        .bind(id)
        .fetch_all(pool)
        .await?;

    if rows.is_empty() {
        return Err(anyhow::anyhow!("Connection not found"));
    }

    let row = &rows[0];
    let credentials: String = row.get("credentials");
    let data = decrypt_data(&credentials, key)?;
    let credentials: Credentials = serde_json::from_str(&data)?;
    let metadata_str: String = row.get("metadata");
    let metadata: Metadata = serde_json::from_str(&metadata_str).unwrap_or_default();
    let dialect_str: String = row.get("dialect");
    let dialect: Dialect = dialect_str.parse()?;
    let mode_str: String = row.get("mode");
    let mode: Mode = mode_str.parse()?;
    let schema: String = row.get("schema");
    let conn_id: String = row.get("id");

    Ok(ConnectionConfig {
        id: Uuid::parse_str(&conn_id)?,
        name: row.get("name"),
        color: row.get("color"),
        dialect,
        mode,
        credentials,
        schema,
        metadata,
    })
}
