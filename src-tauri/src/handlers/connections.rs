use crate::{
    database::connections::{self, ConnectedConnection, ConnectionConfig, Scheme},
    state::{AsyncState, ServiceAccess},
    utils::error::{CommandResult, Error},
};
use tauri::{command, AppHandle};
use tracing::info;

#[command]
pub fn add_connection(
    app_handle: AppHandle,
    name: &str,
    scheme: Scheme,
    color: &str,
) -> CommandResult<()> {
    info!(?name, ?scheme, ?color, "add_connection");
    let conn = ConnectionConfig::new(name, scheme, color)?;
    app_handle
        .db(|db| connections::add_connection(db, &conn))
        .map_err(Error::from)
}

#[command]
pub fn delete_connection(app_handle: AppHandle, id: String) -> CommandResult<()> {
    info!(?id, "delete_connection");
    let id = uuid::Uuid::parse_str(id.as_str()).map_err(Error::from)?;
    app_handle
        .db(|db| connections::delete_connection(db, &id))
        .map_err(Error::from)
}

#[command]
pub fn get_connections(app_handle: AppHandle) -> CommandResult<Vec<ConnectionConfig>> {
    info!("get_connections");
    app_handle
        .db(connections::get_all_connections)
        .map_err(Error::from)
}

#[command]
pub async fn init_connection(
    mut app_handle: AppHandle,
    async_state: tauri::State<'_, AsyncState>,
    config: ConnectionConfig,
) -> CommandResult<()> {
    info!(?config, "init_connection");
    let conn = ConnectedConnection::new(config).await?;
    app_handle.add_connection(&conn)?;
    let mut binding = async_state.connections.lock().await;
    binding.insert(conn.config.id.to_string().clone(), conn);
    Ok(())
}
