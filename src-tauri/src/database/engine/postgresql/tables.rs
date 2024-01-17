use anyhow::Result;
use deadpool_postgres::Pool;
use futures::try_join;
use serde_json::{json, Value};

use crate::database::types::connection::InitiatedConnection;

use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: String,
) -> Result<Value> {
    let (columns, constraints, triggers, indices) = try_join!(
        get_columns(conn, pool, Some(&table)),
        get_constraints(conn, pool, &table),
        get_triggers(conn, pool, Some(&table)),
        get_indices(conn, pool, &table),
    )?;

    let result = json!({
        "table": table,
        "columns": columns,
        "constraints": constraints,
        "indices": indices,
        "triggers": triggers,
    });

    Ok(result)
}

pub async fn get_columns(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME, 
        ORDINAL_POSITION, 
        COLUMN_DEFAULT,
        IS_NULLABLE,
        DATA_TYPE, 
        CASE
            WHEN character_maximum_length is not null  and udt_name != 'text'
              THEN CONCAT(udt_name, concat('(', concat(character_maximum_length::varchar(255), ')')))
            WHEN numeric_precision is not null
                    THEN CONCAT(udt_name, concat('(', concat(numeric_precision::varchar(255),',',numeric_scale::varchar(255), ')')))
            WHEN datetime_precision is not null AND udt_name != 'date' THEN
              CONCAT(udt_name, concat('(', concat(datetime_precision::varchar(255), ')')))
            ELSE udt_name
        END as COLUMN_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        CHARACTER_OCTET_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}';", query, table),
        None => format!("{};", query),
    };
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_constraints(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
    "SELECT c.column_name, c.table_name, tc.constraint_name, c.table_schema, c.ordinal_position
        FROM information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
        JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
          AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
        WHERE constraint_type = 'PRIMARY KEY' and c.table_schema = '{}'",
        schema
    );
    let query = format!("{} AND c.table_name = '{}'", query, table);
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_type = 'FUNCTION' AND routine_schema = '{}';",
        schema
    );
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", schema);
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT tablename, indexname, indexdef FROM
                        pg_indexes WHERE schemaname = '{}'",
        schema
    );
    let query = format!("{} and tablename = '{}';", query, table);
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_triggers(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_schemas(pool: &Pool) -> Result<Vec<Value>> {
    let query = "SELECT schema_name schema FROM information_schema.schemata;".to_string();
    Ok(raw_query(pool.clone(), &query).await?)
}

pub async fn get_views(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT table_name FROM INFORMATION_SCHEMA.views WHERE table_schema = '{}'",
        schema
    );
    Ok(raw_query(pool.clone(), &query).await?)
}
