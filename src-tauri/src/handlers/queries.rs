use crate::{
    queues::query::{QueryTask, QueryTaskEnqueueResult, QueryTaskStatus},
    state::{AsyncState, ServiceAccess},
    utils::error::{CommandResult, Error},
};
use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlparser::{dialect::dialect_from_str, parser::Parser};
use tauri::{command, AppHandle, State};
use tracing::info;

#[command]
pub async fn enqueue_query(
    async_state: State<'_, AsyncState>,
    conn_id: String,
    tab_id: String,
    sql: &str,
    _auto_limit: bool,
) -> CommandResult<QueryTaskEnqueueResult> {
    info!(sql, conn_id, tab_id, "enqueue_query");
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
                // let mut stmts = vec![];
                // // reduce to unique statements
                // for stmt in statements.iter() {
                //     if !stmts.contains(&stmt.to_string()) {
                //         stmts.push(stmt.to_string());
                //     }
                // }
                let async_proc_input_tx = async_state.tasks.lock().await;
                for (idx, statement) in statements.iter().enumerate() {
                    info!("Got statement {:?}", statement.to_string());
                    let task = QueryTask::new(conn.clone(), &tab_id, &statement, idx);
                    let res = async_proc_input_tx.send(task.clone()).await;
                    if let Err(e) = res {
                        return Err(Error::from(e));
                    }
                }
                return Ok(QueryTaskEnqueueResult {
                    conn_id,
                    tab_id,
                    status: QueryTaskStatus::Queued,
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
