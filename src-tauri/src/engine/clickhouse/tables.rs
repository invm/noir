use anyhow::Result;
use serde_json::{json, Value};

use crate::engine::types::connection::InitiatedConnection;

use super::client::ClickHouseClient;
use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    client: &ClickHouseClient,
    table: String,
) -> Result<Value> {
    let (columns, indices, pk) = futures::try_join!(
        get_columns(conn, client, Some(&table)),
        get_indices(conn, client, &table),
        get_primary_key(conn, client, &table),
    )?;

    Ok(json!({
        "table": table,
        "columns": columns,
        "foreign_keys": [],
        "indices": indices,
        "triggers": [],
        "primary_key": pk,
    }))
}

pub async fn get_columns(
    conn: &InitiatedConnection,
    client: &ClickHouseClient,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = match table {
        Some(table) => format!(
            "SELECT name AS column_name, type AS data_type, type AS column_type, \
             if(position(type, 'Nullable') > 0, 'YES', 'NO') AS is_nullable, \
             default_expression AS column_default, \
             comment, \
             '{}' AS table_schema, \
             '{}' AS table_name \
             FROM system.columns \
             WHERE database = '{}' AND table = '{}' \
             ORDER BY position",
            schema, table, schema, table
        ),
        None => format!(
            "SELECT name AS column_name, type AS data_type, type AS column_type, \
             if(position(type, 'Nullable') > 0, 'YES', 'NO') AS is_nullable, \
             default_expression AS column_default, \
             comment, \
             '{}' AS table_schema, \
             table AS table_name \
             FROM system.columns \
             WHERE database = '{}' \
             ORDER BY table, position",
            schema, schema
        ),
    };
    raw_query(client, &query).await
}

pub async fn get_primary_key(
    conn: &InitiatedConnection,
    client: &ClickHouseClient,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT primary_key FROM system.tables WHERE database = '{}' AND name = '{}'",
        schema, table
    );
    let rows = raw_query(client, &query).await?;
    let mut result = vec![];
    if let Some(row) = rows.first() {
        if let Some(pk_str) = row.get("primary_key").and_then(|v| v.as_str()) {
            if !pk_str.is_empty() {
                for col in pk_str.split(", ") {
                    result.push(json!({
                        "column_name": col.trim(),
                        "table_name": table,
                        "table_schema": schema,
                    }));
                }
            }
        }
    }
    Ok(result)
}

pub async fn get_foreign_keys(
    _conn: &InitiatedConnection,
    _client: &ClickHouseClient,
    _table: &str,
) -> Result<Vec<Value>> {
    Ok(vec![])
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    client: &ClickHouseClient,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT name AS indexname, expr AS indexdef, type, granularity \
         FROM system.data_skipping_indices \
         WHERE database = '{}' AND table = '{}'",
        schema, table
    );
    raw_query(client, &query).await
}

pub async fn get_functions(
    _conn: &InitiatedConnection,
    _client: &ClickHouseClient,
) -> Result<Vec<Value>> {
    Ok(vec![])
}

pub async fn get_procedures(
    _conn: &InitiatedConnection,
    _client: &ClickHouseClient,
) -> Result<Vec<Value>> {
    Ok(vec![])
}

pub async fn get_triggers(
    _conn: &InitiatedConnection,
    _client: &ClickHouseClient,
    _table: Option<&str>,
) -> Result<Vec<Value>> {
    Ok(vec![])
}

pub async fn get_schemas(client: &ClickHouseClient) -> Result<Vec<Value>> {
    raw_query(client, "SELECT name AS schema FROM system.databases").await
}

pub async fn get_views(
    conn: &InitiatedConnection,
    client: &ClickHouseClient,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT name AS table_name FROM system.tables \
         WHERE database = '{}' AND engine IN ('View', 'MaterializedView')",
        schema
    );
    raw_query(client, &query).await
}
