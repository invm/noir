use crate::{
    database::connections::{self, ConnectionConfig, Scheme},
    state::ServiceAccess,
    utils::error::{CommandResult, Error},
};
use tauri::{command, AppHandle};

#[command]
pub fn add_connection(
    app_handle: AppHandle,
    name: &str,
    scheme: Scheme,
    color: &str,
) -> CommandResult<()> {
    let conn = ConnectionConfig::new(name, scheme, color)?;
    return app_handle
        .db(|db| connections::add_connection(db, &conn))
        .map_err(Error::from);
}

#[command]
pub fn delete_connection(app_handle: AppHandle, id: String) -> CommandResult<()> {
    let id = uuid::Uuid::parse_str(id.as_str()).map_err(Error::from)?;
    return app_handle
        .db(|db| connections::delete_connection(db, &id))
        .map_err(Error::from);
}

#[command]
pub fn get_connections(app_handle: AppHandle) -> CommandResult<Vec<ConnectionConfig>> {
    return app_handle
        .db(|db| connections::get_all_connections(db))
        .map_err(Error::from);
}

