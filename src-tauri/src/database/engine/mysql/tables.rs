use anyhow::Result;
use mysql::Pool;
use serde_json::{json, Value};

use crate::database::connections::ConnectedConnection;

use super::query::raw_query;

pub fn get_table_structure(
    conn: &ConnectedConnection,
    pool: &Pool,
    table_name: String,
) -> Result<Value> {
    let columns = get_columns(conn, pool, Some(&table_name))?;
    let constraints = get_constraints(conn, pool, Some(&table_name))?;
    let triggers = get_triggers(conn, pool, Some(&table_name))?;
    let indices = get_indices(conn, pool, Some(&table_name))?;

    let result = json!({
        "columns": columns,
        "constraints": constraints,
        "indices": indices,
        "triggers": triggers,
    });

    Ok(result)
}

pub fn get_columns(
    conn: &ConnectedConnection,
    pool: &Pool,
    table_name: Option<&str>,
) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        db_name
    );
    let query = match table_name {
        Some(table_name) => format!("{} AND TABLE_NAME = '{}';", query, table_name),
        None => format!("{};", query),
    };
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_constraints(
    conn: &ConnectedConnection,
    pool: &Pool,
    table_name: Option<&str>,
) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION,
                         CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME FROM
                         INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{}'",
        db_name
    );
    let query = match table_name {
        Some(table_name) => format!("{} AND TABLE_NAME = '{}'", query, table_name),
        None => format!("{};", query),
    };
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_functions(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW FUNCTION STATUS WHERE DB = '{}';", db_name);
    let functions = raw_query(_conn, query)?;
    Ok(functions)
}

pub fn get_procedures(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW PROCEDURE STATUS WHERE DB = '{}';", db_name);
    let procedures = raw_query(_conn, query)?;
    Ok(procedures)
}

pub fn get_indices(conn: &ConnectedConnection, pool: &Pool, table_name: Option<&str>) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT table_schema, table_name, index_name, column_name FROM
                        information_schema.statistics WHERE non_unique = 1 AND table_schema = '{}'",
        db_name
    );
    let query = match table_name {
        Some(table_name) => format!("{} and table_name = '{}';", query, table_name),
        None => format!("{};", query),
    };
    let procedures = raw_query(_conn, query)?;
    Ok(procedures)
}

pub fn get_triggers(conn: &ConnectedConnection, pool: &Pool, table_name: Option<&str>) -> Result<Value> {
    let mut _conn = pool.get_conn()?;
    let db_name = conn.config.get_db_name();
    let query = format!("SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'", db_name);
    let query = match table_name {
        Some(table_name) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table_name),
        None => format!("{};", query),
    };
    let triggers = raw_query(_conn, query)?;
    Ok(triggers)
}
