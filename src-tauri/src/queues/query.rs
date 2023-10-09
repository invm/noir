use crate::database::connections::ConnectedConnection;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;
use tauri::Manager;
use tokio::sync::mpsc;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryTaskStatus {
    Queued,
    Progress,
    Completed,
    Error,
}

impl Default for QueryTaskStatus {
    fn default() -> Self {
        QueryTaskStatus::Queued
    }
}

#[derive(Debug, Clone)]
pub struct QueryTask {
    pub conn: ConnectedConnection,
    pub query: String,
    pub tab_idx: usize,
    pub id: String,
    pub status: QueryTaskStatus,
    pub query_idx: usize,
}

impl QueryTask {
    pub fn new(
        conn: ConnectedConnection,
        query: String,
        query_id: String,
        tab_idx: usize,
        query_idx: usize,
    ) -> Self {
        QueryTask {
            conn,
            id: query_id,
            tab_idx,
            query_idx,
            query: query.to_string(),
            status: QueryTaskStatus::Queued,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskEnqueueResult {
    pub conn_id: String,
    pub tab_idx: usize,
    pub status: QueryTaskStatus,
    pub results_sets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskResult {
    pub success: bool,
    pub id: String,
    pub path: Option<String>,
    pub error: Option<String>,
}

pub async fn async_process_model(
    mut input_rx: mpsc::Receiver<QueryTask>,
    output_tx: mpsc::Sender<QueryTaskResult>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let task = input;
        match task.conn.execute_query(task.query).await {
            Ok(_res) => {
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                output_tx
                    .send(QueryTaskResult {
                        success: false,
                        id: task.id,
                        path: Some("asd".to_string()),
                        error: None,
                    })
                    .await?;
            }
            Err(e) => {
                output_tx
                    .send(QueryTaskResult {
                        success: false,
                        id: task.id,
                        path: None,
                        error: Some(e.to_string()),
                    })
                    .await?;
            }
        }
    }
    Ok(())
}

pub async fn rs2js<R: tauri::Runtime>(query: QueryTaskResult, manager: &impl Manager<R>) {
    info!(?query, "rs2js");
    manager.emit_all("rs2js", query).unwrap();
}
