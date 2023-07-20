use anyhow::Result;
use mysql::Pool;
use serde_json::Value;

use crate::database::connections::ConnectedConnection;

use super::query::raw_query;

pub fn get_columns(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        db_name
    );
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_constraints(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION,
                         CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME FROM
                         INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{}';",
        db_name
    );
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_functions(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW FUNCTION STATUS WHERE DB = '{}';", db_name);
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_procedures(conn: &ConnectedConnection, pool: &Pool) -> Result<Value> {
    let db_name = conn.config.get_db_name();
    let mut _conn = pool.get_conn()?;
    let query = format!("SHOW PROCEDURE STATUS WHERE DB = '{}';", db_name);
    let columns = raw_query(_conn, query)?;
    Ok(columns)
}

pub fn get_triggers(pool: &Pool) -> Result<Value> {
    let mut _conn = pool.get_conn()?;
    let columns = raw_query(_conn, "SHOW TRIGGERS;".to_string())?;
    Ok(columns)
}
