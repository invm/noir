use crate::{
    queues::query::{QueryTask, QueryTaskEnqueueResult, QueryTaskStatus},
    state::{AsyncState, ServiceAccess},
    utils::{
        crypto::md5_hash,
        error::{CommandResult, Error},
    },
};
use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sqlparser::{dialect::dialect_from_str, parser::Parser};
use tauri::{command, AppHandle, State};
use tracing::info;

#[command]
pub async fn enqueue_query(
    async_state: State<'_, AsyncState>,
    conn_id: String,
    tab_idx: usize,
    sql: &str,
    auto_limit: bool,
) -> CommandResult<QueryTaskEnqueueResult> {
    info!(sql, conn_id, tab_idx, "enqueue_query");
    let binding = async_state.connections.lock().await;
    let conn = binding.get(&conn_id);
    let dialect = conn.unwrap().config.dialect.as_str();
    let statements: Result<Vec<String>, Error> =
        match Parser::parse_sql(dialect_from_str(dialect).unwrap().as_ref(), sql) {
            Ok(statements) => Ok(statements.into_iter().map(|s| s.to_string()).collect()),
            Err(e) => Err(Error::from(e)),
        };
    match statements {
        Ok(statements) => {
            if let Some(conn) = conn {
                let statements: Vec<(String, String)> = statements
                    .into_iter()
                    .map(|s| {
                        let query_hash = md5_hash(&s);
                        let id = conn.config.id.to_string() + &tab_idx.to_string() + &query_hash;
                        return (s, id);
                    })
                    .collect();
                let async_proc_input_tx = async_state.tasks.lock().await;
                let enqueued_ids: Vec<String> = vec![];
                for (idx, stmt) in statements.iter().enumerate() {
                    let (mut statement, id) = stmt.clone();
                    info!("Got statement {:?}", statement);
                    if enqueued_ids.contains(&id) {
                        continue;
                    }
                    if auto_limit && !statement.to_lowercase().contains("limit") {
                        statement = format!("{} LIMIT 1000", statement);
                    }
                    let task = QueryTask::new(conn.clone(), statement, id, tab_idx, idx);
                    let res = async_proc_input_tx.send(task.clone()).await;
                    if let Err(e) = res {
                        return Err(Error::from(e));
                    }
                }
                return Ok(QueryTaskEnqueueResult {
                    conn_id,
                    tab_idx,
                    status: QueryTaskStatus::Queued,
                    results_sets: statements.iter().map(|s| s.1.clone()).collect(),
                });
            }
            if statements.is_empty() {
                return Err(Error::from(anyhow!("No statements found")));
            }
            Err(Error::from(anyhow!("Could not acquire connection")))
        }
        Err(e) => Err(e),
    }
}

#[derive(Serialize, Deserialize)]
pub struct QueryResultParams {
    pub conn_id: String,
    pub query_hash: String,
    pub page: usize,
    pub page_size: usize,
}

#[command]
pub async fn execute_query(
    app_handle: AppHandle,
    conn_id: String,
    query: String,
    _auto_limit: bool,
) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.execute_query(&query).await?;
    Ok(json!({ "result": result }))
}

#[command]
pub async fn query_results(
    _app_handle: AppHandle,
    _params: QueryResultParams,
) -> CommandResult<Value> {
    // let connection = app_handle.acquire_connection(conn_id);
    // let result = connection.execute_query(query).await?;
    Ok(Value::Null)
}

#[command]
pub async fn get_table_structure(
    app_handle: AppHandle,
    conn_id: String,
    table: String,
) -> CommandResult<Value> {
    info!(?conn_id, ?table, "get_table_structure");
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_table_structure(table).await?;
    Ok(result)
}

#[command]
pub async fn get_columns(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    info!(?conn_id, "get_columns");
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_columns().await?;
    Ok(result)
}

#[command]
pub async fn get_constraints(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    info!(?conn_id, "get_constraints");
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_constraints().await?;
    Ok(result)
}

#[command]
pub async fn get_triggers(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    info!(?conn_id, "get_triggers");
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_triggers().await?;
    Ok(result)
}

#[command]
pub async fn get_functions(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    info!(?conn_id, "get_functions");
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_functions().await?;
    Ok(result)
}

#[command]
pub async fn get_procedures(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    info!(?conn_id, "get_procedures");
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_procedures().await?;
    Ok(stats)
}
