use anyhow::{anyhow, Result};
use deadpool_sqlite::Pool;
use serde_json::Value;

use crate::{
    engine::types::result::{ResultSet, TableMetadata},
    utils::error::Error,
};

use super::utils::row_to_object;

pub async fn raw_query(pool: &Pool, query: &str) -> Result<Vec<Value>> {
    let conn = pool.get().await.expect("Failed to get connection");
    let query = query.to_string();
    let mut result: Vec<Value> = Vec::new();
    let rows = conn
        .interact(move |conn| {
            let mut stmt = conn.prepare(&query).expect("Failed to prepare statement");
            let columns_count = stmt.column_count();
            let mut rows = stmt.query([]).expect("Failed to execute query");
            while let Some(row) = rows.next().expect("Failed to get row") {
                result.push(row_to_object(row, columns_count));
            }
            result
        })
        .await;
    rows.map_err(|e| anyhow!(e.to_string()))
}

pub async fn execute_query(pool: &Pool, query: &str) -> Result<ResultSet> {
    let start_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;
    let conn = pool.get().await.expect("Failed to get connection");
    let query = query.to_string();
    let rows = conn
        .interact(move |conn| {
            let stmt = conn.prepare(&query);
            match stmt {
                Ok(mut stmt) => {
                    let mut result: Vec<Value> = Vec::new();
                    let columns_count = stmt.column_count();
                    match stmt.query([]) {
                        Ok(mut rows) => {
                            while let Some(row) = rows.next().expect("Failed to get row") {
                                result.push(row_to_object(row, columns_count));
                            }
                            Ok(result)
                        }
                        Err(e) => Err(e),
                    }
                }
                Err(e) => Err(e),
            }
        })
        .await;
    let rows = rows.expect("Failed to execute query")?;
    let end_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;
    let set = ResultSet {
        start_time,
        end_time,
        affected_rows: 0,
        warnings: 0,
        info: "".to_string(),
        rows,
        table: TableMetadata {
            table: String::from(""),
            foreign_keys: None,
            primary_key: None,
            columns: None,
        },
    };
    Ok(set)
}

pub async fn execute_tx(pool: &Pool, queries: Vec<&str>) -> Result<(), Error> {
    let conn = pool.get().await.expect("Failed to get connection");
    let queries = queries
        .iter()
        .map(|q| q.to_string())
        .collect::<Vec<String>>();
    conn.interact(move |conn| {
        let tx = conn.transaction()?;

        for query in queries {
            tx.execute(&query, [])
                .expect("Failed to execute query in transaction");
        }

        Ok(tx.commit()?)
    })
    .await
    .map_err(|e| anyhow!(e.to_string()))?
}
