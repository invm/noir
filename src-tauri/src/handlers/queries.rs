use crate::{
    database::connections::{ConnectedConnection, ConnectionConfig},
    state::ServiceAccess,
    utils::error::CommandResult,
};
use log::info;
use tauri::{command, AppHandle};

#[command]
pub fn execute_query(_app_handle: AppHandle, query: String) -> CommandResult<()> {
    info!("execute_query: {}", query);
    println!("{}", sql_lexer::sanitize_string(query.to_string()));
    Ok(())
}

#[command]
pub async fn ping_db(app_handle: AppHandle, conn_id: String) -> CommandResult<()> {
    let connection = app_handle.acquire_connection(conn_id);
    info!("connection: {:?}", connection);
    let res = connection.ping().await?;
    info!("ping_db: {:?}", res);
    Ok(())
}

#[command]
pub async fn init_connection(
    mut app_handle: AppHandle,
    config: ConnectionConfig,
) -> CommandResult<()> {
    info!("init_connection 30: {:?}", config);
    let conn = ConnectedConnection::new(config).await?;
    info!("connection: {:?}", conn);
    app_handle.add_connection(conn)?;
    info!("after add");
    Ok(())
}
