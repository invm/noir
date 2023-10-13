use anyhow::Result;
use mysql::prelude::Queryable;
use mysql::{from_row, Pool, PooledConn, Row};
use serde_json::json;

use crate::database::connections::ResultSet;

use super::utils::convert_value;

fn row_to_object(row: Row) -> serde_json::Value {
    let mut object = json!({});
    for column in row.columns_ref() {
        let column_value = &row[column.name_str().as_ref()];
        let value = convert_value(column_value);
        object[column.name_str().as_ref()] = value;
    }

    return object;
}

pub fn raw_query(mut conn: PooledConn, query: String) -> Result<serde_json::Value> {
    let rows: Vec<Row> = conn.query(&query)?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row_to_object(row));
    }
    let result = json!({ "result": result });
    return Ok(result);
}

pub fn execute_query(pool: &Pool, query: &str) -> Result<ResultSet> {
    let mut conn = pool.get_conn()?;
    let mut results = conn.query_iter(query)?;
    while let Some(result_set) = results.iter() {
        let affected_rows = result_set.affected_rows();
        let warnings = result_set.warnings();
        let info = &result_set.info_str().to_string();
        let mut rows = Vec::new();
        for row in result_set {
            rows.push(row_to_object(from_row(row?)));
        }
        let set = ResultSet {
            affected_rows,
            warnings,
            info: info.to_string(),
            rows,
        };
        return Ok(set);
    }

    return Ok(ResultSet {
        affected_rows: 0,
        warnings: 0,
        info: "".to_string(),
        rows: Vec::new(),
    });
}
