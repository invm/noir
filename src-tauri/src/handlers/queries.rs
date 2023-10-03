use crate::{
    database::connections::{ConnectedConnection, ConnectionConfig},
    state::ServiceAccess,
    utils::error::CommandResult,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{command, AppHandle};

#[command]
pub async fn execute_query(
    app_handle: AppHandle,
    conn_id: String,
    query: String,
    _auto_limit: bool,
) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.execute_query(query).await?;
    Ok(result)
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
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_table_structure(table).await?;
    Ok(result)
}

#[command]
pub async fn get_columns(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_columns().await?;
    Ok(result)
}

#[command]
pub async fn get_constraints(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_constraints().await?;
    Ok(result)
}

#[command]
pub async fn get_triggers(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_triggers().await?;
    Ok(result)
}

#[command]
pub async fn get_functions(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_functions().await?;
    Ok(result)
}

#[command]
pub async fn get_procedures(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_procedures().await?;
    Ok(stats)
}

#[command]
pub async fn init_connection(
    mut app_handle: AppHandle,
    config: ConnectionConfig,
) -> CommandResult<()> {
    let conn = ConnectedConnection::new(config).await?;
    app_handle.add_connection(conn)?;
    Ok(())
}
