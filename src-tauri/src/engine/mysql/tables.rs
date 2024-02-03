use anyhow::Result;
use futures::try_join;
use mysql::Pool;
use serde_json::{json, Value};

use crate::engine::types::connection::InitiatedConnection;

use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: String,
) -> Result<Value> {
    let (columns, foreign_keys, triggers, indices, pk) = try_join!(
        get_columns(conn, pool, Some(&table)),
        get_foreign_keys(conn, pool, &table),
        get_triggers(conn, pool, Some(&table)),
        get_indices(conn, pool, &table),
        get_primary_key(conn, pool, &table),
    )?;

    let result = json!({
        "table": table,
        "columns": columns,
        "foreign_keys": foreign_keys,
        "indices": indices,
        "triggers": triggers,
        "primary_key": pk,
    });

    Ok(result)
}

pub async fn get_columns(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT 
        COLUMN_NAME, 
        COLUMN_TYPE, 
        COLUMN_KEY,
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH,
        ORDINAL_POSITION,
        CHARACTER_OCTET_LENGTH,
        CHARACTER_SET_NAME,
        COLLATION_NAME,
        COLUMN_COMMENT,
        TABLE_SCHEMA,
        TABLE_NAME
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!(
            "{} AND TABLE_NAME = '{}' ORDER BY ORDINAL_POSITION;",
            query, table
        ),
        None => format!("{} ORDER BY ORDINAL_POSITION;", query),
    };
    Ok(raw_query(_conn, query)?)
}

pub async fn get_primary_key(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION,
                         CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME FROM
                         INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'PRIMARY' AND TABLE_SCHEMA = '{}'",
        schema
    );
    let query = format!("{} AND TABLE_NAME = '{}'", query, table);
    Ok(raw_query(_conn, query)?)
}

pub async fn get_foreign_keys(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT rc.constraint_name, kc.column_name, kc.referenced_table_name, kc.referenced_column_name,  rc.update_rule, rc.delete_rule
            FROM information_schema.referential_constraints rc
            JOIN information_schema.key_column_usage kc ON rc.constraint_schema = kc.table_schema
                 AND rc.table_name = kc.table_name
                 AND rc.constraint_name = kc.constraint_name
            WHERE rc.constraint_schema = '{}'",
        schema
    );
    let query = format!("{} AND rc.TABLE_NAME = '{}'", query, table);
    Ok(raw_query(_conn, query)?)
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let db = conn.config.credentials.get("db_name").expect("Failed to get db_name from credentials").as_str();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW FUNCTION STATUS WHERE DB = '{}';", db);
    Ok(raw_query(_conn, query)?)
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;

    let query = format!("SELECT * FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", schema);
    Ok(raw_query(_conn, query)?)
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT INDEX_NAME, COLUMN_NAME, TABLE_SCHEMA, TABLE_NAME FROM
                        information_schema.statistics WHERE table_schema = '{}'",
        schema
    );
    let query = format!("{} and TABLE_NAME = '{}';", query, table);
    Ok(raw_query(_conn, query)?)
}

pub async fn get_triggers(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let mut _conn = pool.get_conn()?;
    let schema = conn.get_schema();
    let query = format!(
        "SELECT trigger_name, event_manipulation, action_timing, action_statement, created,
            action_condition FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    Ok(raw_query(_conn, query)?)
}

pub async fn get_schemas(pool: &Pool) -> Result<Vec<Value>> {
    let mut _conn = pool.get_conn()?;
    let query = "select schema_name 'schema' from information_schema.schemata;".to_string();
    let schemas = raw_query(_conn, query)?;
    Ok(schemas)
}

pub async fn get_views(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM information_schema.tables 
            WHERE TABLE_TYPE LIKE 'VIEW' and table_schema = '{}';",
        schema
    );
    Ok(raw_query(_conn, query)?)
}
