use anyhow::Result;
use mysql::prelude::Queryable;
use mysql::{PooledConn, Row, Pool};
use serde_json::json;

use super::utils::convert_value;

pub fn raw_query(mut conn: PooledConn, query: String) -> Result<serde_json::Value> {
    let rows: Vec<Row> = conn.query(&query)?;
    let mut result = Vec::new();
    for row in rows {
        let mut object = json!({});
        for column in row.columns_ref() {
            let column_value = &row[column.name_str().as_ref()];
            let value = convert_value(column_value);
            object[column.name_str().as_ref()] = value;
        }
        result.push(object);
    }
    let result = json!({ "result": result });
    return Ok(result);
}

pub fn execute_query(pool: &Pool, query: String) -> Result<serde_json::Value> {
    let mut conn = pool.get_conn()?;
    let rows: Vec<Row> = conn.query(&query)?;
    let mut result = Vec::new();
    for row in rows {
        let mut object = json!({});
        for column in row.columns_ref() {
            let column_value = &row[column.name_str().as_ref()];
            let value = convert_value(column_value);
            object[column.name_str().as_ref()] = value;
        }
        result.push(object);
    }
    let result = json!({ "result": result });
    return Ok(result);
}

