use crate::{
    database::connections::{ConnectedConnection, ConnectionConfig},
    state::ServiceAccess,
    utils::error::CommandResult,
};
use serde_json::Value;
use tauri::{command, AppHandle};

#[command]
pub async fn execute_query(app_handle: AppHandle, conn_id: String, mut query: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    if !query.to_lowercase().ends_with("limit 100") {
        query.push_str(" limit 100");
    }
    let result = connection.execute_query(query).await?;
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
