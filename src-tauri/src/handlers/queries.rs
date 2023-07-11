use crate::{database::connections::ConnectionConfig, utils::error::CommandResult, state::ServiceAccess};
use log::info;
use tauri::{command, AppHandle};

#[command]
pub fn execute_query(_app_handle: AppHandle, query: String) -> CommandResult<()> {
    info!("execute_query: {}", query);
    println!("{}", sql_lexer::sanitize_string(query.to_string()));
    Ok(())
}

#[command]
pub async fn ping_db(app_handle: AppHandle, conn: ConnectionConfig) -> CommandResult<()> {
    let res = app_handle.acquire_connection(conn.id.to_string()).ping().await;
    info!("ping_db: {:?}", res);
    Ok(())
}

#[command]
pub fn init_db(_app_handle: AppHandle, _conn: ConnectionConfig) -> CommandResult<()> {
    Ok(())
}
