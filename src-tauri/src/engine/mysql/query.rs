use crate::database::QueryType;
use crate::engine::types::result::ResultSet;
use anyhow::{anyhow, Result};
use sqlx::MySqlPool;

use super::sql_to_json::row_to_json;

pub async fn execute_query(pool: &MySqlPool, query: &str, t: QueryType) -> Result<ResultSet> {
    let start_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;
    match t {
        QueryType::Select => {
            let rows = sqlx::query(query).map(row_to_json).fetch_all(pool).await?;
            Ok(ResultSet {
                start_time,
                end_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_millis() as u64,
                affected_rows: 0,
                rows,
                table: None,
            })
        }
        _ => {
            let result = sqlx::query(query).execute(pool).await?;
            let affected_rows = result.rows_affected();
            let end_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as u64;
            Ok(ResultSet {
                start_time,
                end_time,
                affected_rows,
                rows: vec![],
                table: None,
            })
        }
    }
}

pub async fn execute_tx(pool: &MySqlPool, queries: Vec<&str>) -> Result<()> {
    let mut transaction = pool.begin().await?;

    for q in queries {
        match sqlx::query(q).execute(&mut *transaction).await {
            Ok(_) => continue,
            Err(e) => {
                // Attempt to rollback the transaction
                let _ = transaction.rollback();
                return Err(anyhow!("Query failed: {}", e));
            }
        }
    }
    transaction.commit().await?;
    Ok(())
}
