use crate::{
    database::{
        init_conn::init_conn,
        queries,
        types::config::{ConnectionConfig, Credentials, Dialect, Mode},
    },
    state::ServiceAccess,
    utils::error::{CommandResult, Error},
};
use tauri::{command, AppHandle};
use tracing::info;

#[command]
pub fn add_connection(
    app_handle: AppHandle,
    dialect: Dialect,
    mode: Mode,
    credentials: Credentials,
    name: &str,
    color: &str,
) -> CommandResult<()> {
    info!(?name, ?dialect, ?mode, ?color, "add_connection");
    let conn = ConnectionConfig::new(dialect, mode, credentials, name, color)?;
    info!(?conn, "add_connection");
    app_handle
        .db(|db| queries::add_connection(db, &conn))
        .map_err(Error::from)
}

#[command]
pub async fn test_connection(
    mut app_handle: AppHandle,
    dialect: Dialect,
    mode: Mode,
    credentials: Credentials,
    name: &str,
    color: &str,
) -> CommandResult<()> {
    info!(?name, ?dialect, ?mode, ?color, "test_connection");
    let cfg = ConnectionConfig::new(dialect, mode, credentials, name, color)?;
    let conn = init_conn(cfg).await?;
    app_handle.connect(&conn.clone())?;
    let id = conn.config.id.clone().to_string();
    app_handle.disconnect(&id)?;
    Ok(())
}

#[command]
pub fn delete_connection(app_handle: AppHandle, id: String) -> CommandResult<()> {
    info!(?id, "delete_connection");
    let id = uuid::Uuid::parse_str(id.as_str()).map_err(Error::from)?;
    app_handle
        .db(|db| queries::delete_connection(db, &id))
        .map_err(Error::from)
}

#[command]
pub fn get_connections(app_handle: AppHandle) -> CommandResult<Vec<ConnectionConfig>> {
    info!("get_connections");
    app_handle
        .db(queries::get_all_connections)
        .map_err(Error::from)
}

#[command]
pub async fn init_connection(
    mut app_handle: AppHandle,
    config: ConnectionConfig,
) -> CommandResult<()> {
    info!(?config.name, ?config.dialect, ?config.mode, "init_connection");
    let conn = init_conn(config).await?;
    app_handle.connect(&conn)?;
    Ok(())
}

#[command]
pub async fn disconnect(mut app_handle: AppHandle, id: &str) -> CommandResult<()> {
    info!(?id, "disconnect");
    app_handle.disconnect(&id)?;
    Ok(())
}

#[command]
pub async fn set_schema(
    app_handle: AppHandle,
    conn_id: String,
    schema: String,
) -> CommandResult<()> {
    info!(?conn_id, ?schema, "set_schema");
    let conn = app_handle.acquire_connection(conn_id.clone());
    let conn = conn.set_schema(schema.clone());
    app_handle.db(|db| queries::update_connection_schema(db, &conn_id, &schema))?;
    Ok(app_handle.update_connection(conn)?)
}
