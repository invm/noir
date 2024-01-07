use anyhow::Result;
use deadpool_postgres::{GenericClient, Pool};
use futures::{pin_mut, TryStreamExt};
use serde_json::Value;

use crate::{
    database::connections::{PreparedStatement, ResultSet, TableMetadata},
    utils::error::Error,
};

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
        table: TableMetadata {
            table: String::from(""),
            constraints: None,
            columns: None,
        },
    };
    Ok(set)
}

pub async fn execute_tx(pool: &Pool, queries: Vec<PreparedStatement>) -> Result<(), Error> {
    let mut conn = pool.get().await?;
    let tx = conn.transaction().await?;
    for q in queries {
        match tx.execute_raw(&q.statement, &q.params).await {
            Ok(..) => {}
            Err(e) => {
                tx.rollback().await?;
                return Err(Error::TxError(e.to_string()));
            }
        }
    }
    tx.commit().await?;
    Ok(())
}
