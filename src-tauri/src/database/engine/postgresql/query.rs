use anyhow::Result;
use deadpool_postgres::Pool;
use futures::{pin_mut, TryStreamExt};
use serde_json::Value;

use crate::database::connections::ResultSet;

use super::utils::row_to_object;

pub async fn raw_query(pool: Pool, query: &str) -> Result<Vec<Value>> {
    let conn = pool.get().await?;
    let params = vec![];
    let rows = conn.query(query, &params).await?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row_to_object(row)?);
    }
    Ok(result)
}

pub async fn execute_query(pool: &Pool, query: &str) -> Result<ResultSet> {
    let conn = pool.get().await?;
    let params: Vec<String> = vec![];
    let it = conn.query_raw(query, &params).await?;
    let mut rows: Vec<Value> = Vec::new();
    pin_mut!(it);
    while let Some(row) = it.try_next().await? {
        rows.push(row_to_object(row)?);
    }
    let affected_rows = it.rows_affected().unwrap_or(0);
    let warnings = 0;
    let info = "";
    let set = ResultSet {
        affected_rows,
        warnings,
        info: info.to_string(),
        rows,
        constraints: None,
        columns: None,
    };
    Ok(set)
}
