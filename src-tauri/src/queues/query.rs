use crate::engine::types::connection::InitiatedConnection;
use crate::engine::types::result::TableMetadata;
use crate::utils::fs::write_query;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;
use tauri::Manager;
use tokio::sync::mpsc;
use tracing::info;

pub enum Events {
    QueryFinished,
}

impl Events {
    fn as_str(&self) -> &'static str {
        match self {
            Events::QueryFinished => "query_finished",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryTaskStatus {
    Progress,
    Completed,
    Error,
}

impl Default for QueryTaskStatus {
    fn default() -> Self {
        QueryTaskStatus::Progress
    }
}

#[derive(Debug, Clone)]
pub struct QueryTask {
    pub conn: InitiatedConnection,
    pub query: String,
    pub id: String,
    pub status: QueryTaskStatus,
    pub tab_idx: usize,
    pub query_idx: usize,
    pub table: Option<String>,
}

impl QueryTask {
    pub fn new(
        conn: InitiatedConnection,
        query: String,
        query_id: String,
        tab_idx: usize,
        query_idx: usize,
        table: Option<String>,
    ) -> Self {
        QueryTask {
            conn,
            id: query_id,
            tab_idx,
            query_idx,
            query: query.to_string(),
            status: QueryTaskStatus::Progress,
            table,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskEnqueueResult {
    pub conn_id: String,
    pub tab_idx: usize,
    pub status: QueryTaskStatus,
    pub result_sets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskResult {
    pub conn_id: String,
    pub status: QueryTaskStatus,
    pub query: String,
    pub id: String,
    pub path: Option<String>,
    pub error: Option<String>,
    pub info: Option<String>,
    pub count: Option<usize>,
    pub tab_idx: usize,
    pub query_idx: usize,
}

pub async fn async_process_model(
    mut input_rx: mpsc::Receiver<QueryTask>,
    output_tx: mpsc::Sender<QueryTaskResult>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let task = input;
        // so what happened is that this ran too fast and the UI didn't have time to update, a single millisecond is enough
        tokio::time::sleep(tokio::time::Duration::from_nanos(1)).await;
        match task.conn.execute_query(&task.query).await {
            Ok(mut result_set) => {
                if let Some(table) = task.table {
                    let foreign_keys = task.conn.get_foreign_keys(&table).await?;
                    let primary_key = task.conn.get_primary_key(&table).await?;
                    let columns = task.conn.get_columns(Some(&table)).await?;
                    result_set.table = TableMetadata {
                        table,
                        foreign_keys: Some(foreign_keys),
                        primary_key: Some(primary_key),
                        columns: Some(columns),
                    }
                }
                match write_query(&task.id, &result_set) {
                    Ok(path) => {
                        output_tx
                            .send(QueryTaskResult {
                                conn_id: task.conn.config.id.to_string(),
                                count: Some(result_set.rows.len()),
                                status: QueryTaskStatus::Completed,
                                query: task.query,
                                id: task.id,
                                query_idx: task.query_idx,
                                tab_idx: task.tab_idx,
                                path: Some(path),
                                error: None,
                                info: Some(result_set.info),
                            })
                            .await?
                    }
                    Err(e) => {
                        output_tx
                            .send(QueryTaskResult {
                                conn_id: task.conn.config.id.to_string(),
                                count: None,
                                status: QueryTaskStatus::Error,
                                query: task.query,
                                id: task.id,
                                query_idx: task.query_idx,
                                tab_idx: task.tab_idx,
                                path: None,
                                error: Some(e.to_string()),
                                info: None,
                            })
                            .await?
                    }
                }
            }
            Err(e) => {
                output_tx
                    .send(QueryTaskResult {
                        conn_id: task.conn.config.id.to_string(),
                        count: None,
                        status: QueryTaskStatus::Error,
                        query: task.query,
                        id: task.id,
                        query_idx: task.query_idx,
                        tab_idx: task.tab_idx,
                        path: None,
                        error: Some(e.to_string()),
                        info: None,
                    })
                    .await?;
            }
        }
    }
    Ok(())
}

pub async fn rs2js<R: tauri::Runtime>(result: QueryTaskResult, manager: &impl Manager<R>) {
    info!(?result, "rs2js");
    manager
        .emit_all(Events::QueryFinished.as_str(), result)
        .expect("Failed to emit query_finished event");
}
