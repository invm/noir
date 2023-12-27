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
    let db_name = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME, 
        COLUMN_TYPE, 
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
        db_name
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
    let db_name = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION,
                         CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME FROM
                         INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{}'",
        db_name
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}'", query, table),
        None => format!("{};", query),
    };
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW FUNCTION STATUS WHERE DB = '{}';", db_name);
    let functions = raw_query(_conn, query)?;
    Ok(functions)
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.get_schema();
    let mut _conn = pool.get_conn()?;

    let query = format!("SELECT * FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", db_name);
    let procedures = raw_query(_conn, query)?;
    Ok(procedures)
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let db_name = conn.get_schema();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM
                        information_schema.statistics WHERE non_unique = 1 AND table_schema = '{}'",
        db_name
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
    let db_name = conn.get_schema();
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        db_name
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    let triggers = raw_query(_conn, query)?;
    Ok(triggers)
}

pub async fn get_databases(pool: &Pool) -> Result<Value> {
    let mut _conn = pool.get_conn()?;
    let query = "SHOW DATABASES".to_string();
    let triggers = raw_query(_conn, query)?;
    Ok(triggers)
}
