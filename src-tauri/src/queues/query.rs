use crate::database::connections::ConnectedConnection;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;
use tauri::Manager;
use tokio::sync::mpsc;
use tracing::info;
use uuid::Uuid;

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
    pub query: String,
    pub id: String,
    pub status: QueryTaskStatus,
}

impl QueryTask {
    pub fn new(conn: ConnectedConnection, query: &str) -> Self {
        let id = Uuid::new_v4();
        QueryTask {
            query: query.to_string(),
            id: id.to_string(),
            status: QueryTaskStatus::Queued,
        }
    }
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
