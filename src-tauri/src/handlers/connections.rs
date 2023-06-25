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
    scheme: String,
    save_password: bool,
    color: &str,
) -> CommandResult<()> {
    // let conn: DBConnection = conn.try_into()?;
    let scheme = Scheme::try_from(scheme.as_str())?;
    let conn = ConnectionConfig::new(name, scheme, save_password, color)?;
    return app_handle
        .db(|db| connections::add_connection(db, &conn))
        .map_err(Error::from);
}
//
// #[command]
// pub fn update_connection(app_handle: AppHandle, conn: DBConnection) -> CommandResult<()> {
//     return app_handle
//         .db(|db| queries::update_connection(db, &conn))
//         .map_err(Error::from);
// }
//
// #[command]
// pub fn delete_connection(app_handle: AppHandle, conn: DBConnection) -> CommandResult<()> {
//     return app_handle
//         .db(|db| queries::delete_connection(db, &conn))
//         .map_err(Error::from);
// }
//
// #[command]
// pub fn get_all_connections(app_handle: AppHandle) -> CommandResult<Vec<DBConnection>> {
//     return app_handle
//         .db(|db| queries::get_all_connections(db, 10, 0))
//         .map_err(Error::from);
// }

// #[command]
// pub fn get_connection_by_id(app_handle: AppHandle, id: u32) -> CommandResult<DBConnection> {
//     return app_handle
//         .db(|db| queries::get_connection_by_id(db, id))
//         .map_err(Error::from);
// }
