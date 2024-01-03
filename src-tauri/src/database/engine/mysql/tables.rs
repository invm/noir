use anyhow::Result;
use futures::try_join;
use mysql::Pool;
use serde_json::{json, Value};

use crate::database::connections::InitiatedConnection;

use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: String,
) -> Result<Value> {
    let (columns, constraints, triggers, indices) = try_join!(
        get_columns(conn, pool, Some(&table)),
        get_constraints(conn, pool, Some(&table)),
        get_triggers(conn, pool, Some(&table)),
        get_indices(conn, pool, Some(&table)),
    )?;

    let result = json!({
        "table": table,
        "columns": columns["result"],
        "constraints": constraints["result"],
        "indices": indices["result"],
        "triggers": triggers["result"],
    });

    Ok(result)
}

pub async fn get_columns(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME, 
        COLUMN_TYPE, 
        ORDINAL_POSITION,
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        CHARACTER_OCTET_LENGTH,
        CHARACTER_SET_NAME,
        COLLATION_NAME,
        COLUMN_COMMENT,
        COLUMN_DEFAULT,
        COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}';", query, table),
        None => format!("{};", query),
    };
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub async fn get_constraints(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION,
                         CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME FROM
                         INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}'", query, table),
        None => format!("{};", query),
    };
    let fks = raw_query(_conn, query)?;
    Ok(fks)
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let db = conn.config.credentials.get("db_name").unwrap().as_str();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW FUNCTION STATUS WHERE DB = '{}';", db);
    let functions = raw_query(_conn, query)?;
    Ok(functions)
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;

    let query = format!("SELECT * FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", schema);
    let procedures = raw_query(_conn, query)?;
    Ok(procedures)
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM
                        information_schema.statistics WHERE non_unique = 1 AND table_schema = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} and TABLE_NAME = '{}';", query, table),
        None => format!("{};", query),
    };
    let procedures = raw_query(_conn, query)?;
    Ok(procedures)
}

pub async fn get_triggers(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let mut _conn = pool.get_conn()?;
    let schema = conn.get_schema();
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    let indices = raw_query(_conn, query)?;
    Ok(indices)
}

pub async fn get_schemas(pool: &Pool) -> Result<Value> {
    let mut _conn = pool.get_conn()?;
    let query = "select schema_name 'schema' from information_schema.schemata;".to_string();
    let schemas = raw_query(_conn, query)?;
    Ok(schemas)
}

pub async fn get_views(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let schema = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM information_schema.tables 
            WHERE TABLE_TYPE LIKE 'VIEW' and table_schema = '{}';",
        schema
    );
    let views = raw_query(_conn, query)?;
    Ok(views)
}
