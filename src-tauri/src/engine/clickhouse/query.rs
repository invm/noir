use anyhow::{anyhow, Result};
use serde_json::Value;

use crate::database::QueryType;
use crate::engine::types::result::ResultSet;

use super::client::ClickHouseClient;

pub async fn raw_query(client: &ClickHouseClient, query: &str) -> Result<Vec<Value>> {
    let resp = client.query(query).await?;
    let data = resp
        .get("data")
        .and_then(|d| d.as_array())
        .cloned()
        .unwrap_or_default();
    Ok(data)
}

pub async fn execute_query(
    client: &ClickHouseClient,
    query: &str,
    t: QueryType,
) -> Result<ResultSet> {
    let start_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;

    match t {
        QueryType::Select => {
            let resp = client.query(query).await?;
            let rows = resp
                .get("data")
                .and_then(|d| d.as_array())
                .cloned()
                .unwrap_or_default();
            let end_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as u64;
            Ok(ResultSet {
                start_time,
                end_time,
                affected_rows: 0,
                rows,
                table: None,
            })
        }
        _ => {
            client.query(query).await?;
            let end_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as u64;
            Ok(ResultSet {
                start_time,
                end_time,
                affected_rows: 0,
                rows: vec![],
                table: None,
            })
        }
    }
}

pub async fn execute_tx(client: &ClickHouseClient, queries: Vec<&str>) -> Result<()> {
    for q in queries {
        client
            .query(q)
            .await
            .map_err(|e| anyhow!("Query failed: {}", e))?;
    }
    Ok(())
}
