use crate::database::QueryType;
use crate::engine::types::connection::InitiatedConnection;
use crate::engine::types::result::ResultSet;
use serde::Deserialize;
use serde::Serialize;
use tokio_util::sync::CancellationToken;

pub enum Events {
    QueryFinished,
}

impl Events {
    pub fn as_str(&self) -> &'static str {
        match self {
            Events::QueryFinished => "query_finished",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum QueryTaskStatus {
    #[default]
    Progress,
    Completed,
    Error,
}

#[derive(Debug, Clone)]
pub struct QueryTask {
    pub conn: InitiatedConnection,
    pub query: String,
    pub id: String,
    pub query_type: QueryType,
    pub status: QueryTaskStatus,
    pub tab_idx: usize,
    pub query_idx: usize,
    pub table: Option<String>,
    pub cancel_token: CancellationToken,
}

impl QueryTask {
    pub fn new(
        conn: InitiatedConnection,
        query: (String, QueryType, String),
        tab_idx: usize,
        query_idx: usize,
        table: Option<String>,
        cancel_token: CancellationToken,
    ) -> Self {
        QueryTask {
            conn,
            query: query.0,
            query_type: query.1,
            id: query.2,
            tab_idx,
            query_idx,
            status: QueryTaskStatus::Progress,
            table,
            cancel_token,
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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct QueryTaskResult {
    pub conn_id: String,
    pub status: QueryTaskStatus,
    pub query: String,
    pub id: String,
    pub path: Option<String>,
    pub error: Option<String>,
    pub count: Option<usize>,
    pub tab_idx: usize,
    pub query_idx: usize,
}

impl QueryTaskResult {
    pub fn error(task: QueryTask, e: anyhow::Error) -> Self {
        QueryTaskResult {
            conn_id: task.conn.config.id.to_string(),
            status: QueryTaskStatus::Error,
            count: None,
            query: task.query,
            id: task.id,
            query_idx: task.query_idx,
            tab_idx: task.tab_idx,
            path: None,
            error: Some(e.to_string()),
        }
    }

    pub fn success(task: QueryTask, result_set: ResultSet, path: String) -> Self {
        QueryTaskResult {
            conn_id: task.conn.config.id.to_string(),
            count: Some(result_set.rows.len()),
            status: QueryTaskStatus::Completed,
            query: task.query,
            id: task.id,
            query_idx: task.query_idx,
            tab_idx: task.tab_idx,
            path: Some(path),
            error: None,
        }
    }
}

