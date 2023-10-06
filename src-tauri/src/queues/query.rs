use crate::database::connections::ConnectedConnection;
use crate::utils::crypto::md5_hash;
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
    pub tab_id: String,
    pub id: String,
    pub status: QueryTaskStatus,
    pub query_idx: usize,
}

impl QueryTask {
    pub fn new(conn: ConnectedConnection, tab_id: &str, query: &str, query_idx: usize) -> Self {
        let query_hash = md5_hash(query);
        let id = conn.config.id.to_string() + tab_id + &query_hash;
        QueryTask {
            conn,
            id,
            tab_id: tab_id.to_string(),
            query_idx,
            query: query.to_string(),
            status: QueryTaskStatus::Queued,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskEnqueueResult {
    pub conn_id: String,
    pub tab_id: String,
    pub status: QueryTaskStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryTaskResult {
    pub success: bool,
    pub id: String,
    pub path: String,
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
                output_tx
                    .send(QueryTaskResult {
                        success: false,
                        id: "asd".to_string(),
                        path: "asd".to_string(),
                        error: None,
                    })
                    .await?;
            }
            Err(e) => {
                output_tx
                    .send(QueryTaskResult {
                        success: false,
                        id: "asd".to_string(),
                        path: "asd".to_string(),
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
