use anyhow::Result;
use mysql::prelude::Queryable;
use mysql::{from_row, Pool, PooledConn, Row, TxOpts};
use serde_json::Value;
use tracing::info;

use crate::database::types::result::{ResultSet, TableMetadata};
use crate::utils::error::Error;

use super::utils::row_to_object;

pub fn raw_query(mut conn: PooledConn, query: String) -> Result<Vec<Value>> {
    let rows: Vec<Row> = conn.query(&query)?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row_to_object(row));
    }
    Ok(result)
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
            table: TableMetadata {
                table: String::from(""),
                constraints: None,
                columns: None,
            },
        };
        return Ok(set);
    }

    return Ok(ResultSet {
        affected_rows: 0,
        warnings: 0,
        info: "".to_string(),
        rows: Vec::new(),
        table: TableMetadata {
            table: String::from(""),
            constraints: None,
            columns: None,
        },
    });
}

pub fn execute_tx(pool: &Pool, queries: Vec<&str>) -> Result<(), Error> {
    match pool
        .start_transaction(TxOpts::default())
        .and_then(|mut tx| {
            let mut error = None;
            for q in queries {
                let success = tx.query_iter(q);
                if success.is_err() {
                    error = Some(success.err().unwrap());
                    break;
                }
            }
            if error.is_some() {
                info!("Rolling back transaction {:?}", error);
                tx.rollback()?;
                return Err(error.unwrap());
            }
            info!("Committing transaction");
            tx.commit()?;
            Ok(())
        }) {
        Ok(..) => Ok(()),
        Err(e) => Err(Error::TxError(e.to_string())),
    }
}
