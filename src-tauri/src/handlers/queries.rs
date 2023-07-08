use crate::utils::error::CommandResult;
use log::info;
use tauri::{command, AppHandle};

#[command]
pub fn execute_query(_app_handle: AppHandle, query: String) -> CommandResult<()> {
    info!("execute_query: {}", query);
    println!("{}", sql_lexer::sanitize_string(query.to_string()));
    Ok(())
}
