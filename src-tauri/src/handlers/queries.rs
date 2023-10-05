use crate::{
    queues::query::QueryTask,
    state::{AsyncState, ServiceAccess},
    utils::error::{CommandResult, Error},
};
use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlparser::dialect::GenericDialect;
use tauri::{command, AppHandle, State};
use tracing::{error, info};

#[command]
pub async fn enqueue_query(
    async_state: State<'_, AsyncState>,
    conn_id: String,
    sql: &str,
    _auto_limit: bool,
) -> CommandResult<QueryTask> {
    // info!(?sql, "enqueue_query");
    let statements = match sqlparser::parser::Parser::parse_sql(&GenericDialect {}, sql) {
        Ok(s) => s,
        Err(..) => vec![],
    };

    // for statement in statements {
    //     println!("Got statement {:?}", statement.to_string());
    // }
    let binding = async_state.connections.lock().await;
    let conn = binding.get(&conn_id);
    // Ok(())
    if let Some(conn) = conn {
        let async_proc_input_tx = async_state.tasks.lock().await;
        let task = QueryTask::new(conn.clone(), &statements[0].to_string());
        let _ = async_proc_input_tx.send(task.clone()).await;
        return Ok(task);
    }
    Err(Error::from(anyhow!("Could not acquire connection")))
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
