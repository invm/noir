use crate::{
    database::connections::{ConnectedConnection, ConnectionConfig},
    state::ServiceAccess,
    utils::error::CommandResult,
};
use log::info;
use serde_json::Value;
use tauri::{command, AppHandle};

#[command]
pub fn execute_query(_app_handle: AppHandle, query: String) -> CommandResult<()> {
    info!("execute_query: {}", query);
    println!("{}", sql_lexer::sanitize_string(query.to_string()));
    Ok(())
}

#[command]
pub async fn get_columns(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_columns().await?;
    Ok(stats)
}

#[command]
pub async fn get_constraints(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_constraints().await?;
    Ok(stats)
}

#[command]
pub async fn get_triggers(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_triggers().await?;
    Ok(stats)
}

#[command]
pub async fn get_functions(app_handle: AppHandle, conn_id: String) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let stats = connection.get_functions().await?;
    Ok(stats)
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
