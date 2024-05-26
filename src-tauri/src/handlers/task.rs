use tauri::AppHandle;

use crate::{
    state::ServiceAccess,
    utils::error::{CommandResult, Error},
};

#[tauri::command]
pub async fn cancel_task_token(app_handle: AppHandle, ids: Vec<String>) -> CommandResult<()> {
    for id in ids.iter() {
        app_handle
            .cancel_token(id.clone())
            .await
            .map_err(Error::from)?;
    }
    Ok(())
}
