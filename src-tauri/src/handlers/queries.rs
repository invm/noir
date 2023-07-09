use crate::{database::connections::ConnectionConfig, utils::error::CommandResult};
use log::info;
use tauri::{command, AppHandle};

#[command]
pub fn execute_query(_app_handle: AppHandle, query: String) -> CommandResult<()> {
    info!("execute_query: {}", query);
    println!("{}", sql_lexer::sanitize_string(query.to_string()));
    Ok(())
}

#[command]
pub fn ping_db(_app_handle: AppHandle, _conn: ConnectionConfig) -> CommandResult<()> {
    Ok(())
}

#[command]
pub fn init_db(_app_handle: AppHandle, _conn: ConnectionConfig) -> CommandResult<()> {
    Ok(())
}
