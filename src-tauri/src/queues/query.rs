use crate::database::connections::ConnectedConnection;
use crate::utils::init::write_query;
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
    pub id: String,
    pub status: QueryTaskStatus,
    pub tab_idx: usize,
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
    pub status: QueryTaskStatus,
    pub query: String,
    pub id: String,
    pub path: Option<String>,
    pub error: Option<String>,
    pub tab_idx: usize,
    pub query_idx: usize,
}

pub async fn async_process_model(
    mut input_rx: mpsc::Receiver<QueryTask>,
    output_tx: mpsc::Sender<QueryTaskResult>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let task = input;
        match task.conn.execute_query(&task.query).await {
            Ok(content) => {
                match write_query(&task.id, &content.to_string()) {
                    Ok(path) => {
                        output_tx
                            .send(QueryTaskResult {
                                status: QueryTaskStatus::Completed,
                                query: task.query,
                                id: task.id,
                                query_idx: task.query_idx,
                                tab_idx: task.tab_idx,
                                path: Some(path),
                                error: None,
                            })
                            .await?
                    }
                    Err(e) => {
                        output_tx
                            .send(QueryTaskResult {
                                status: QueryTaskStatus::Error,
                                query: task.query,
                                id: task.id,
                                query_idx: task.query_idx,
                                tab_idx: task.tab_idx,
                                path: None,
                                error: Some(e.to_string()),
                            })
                            .await?
                    }
                }
            }
            Err(e) => {
                output_tx
                    .send(QueryTaskResult {
                        status: QueryTaskStatus::Error,
                        query: task.query,
                        id: task.id,
                        query_idx: task.query_idx,
                        tab_idx: task.tab_idx,
                        path: None,
                        error: Some(e.to_string()),
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
        .unwrap();
}
