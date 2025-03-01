use crate::{
    database::queries,
    engine::{
        init::init_conn,
        types::config::{ConnectionConfig, Credentials, Dialect, Metadata, Mode},
    },
    handlers::task::cancel_task_token,
    state::ServiceAccess,
    utils::{
        crypto::get_app_key,
        error::{CommandResult, Error},
    },
};
use anyhow::anyhow;
use log::info;
use tauri::{command, AppHandle};

#[command]
pub fn add_connection(
    app_handle: AppHandle,
    dialect: Dialect,
    mode: Mode,
    credentials: Credentials,
    name: &str,
    color: &str,
    metadata: Metadata,
) -> CommandResult<()> {
    info!("Add connection: {name}, {dialect}, {mode}, {color}");
    let conn = ConnectionConfig::new(dialect, mode, credentials, name, color, metadata)?;
    let key = get_app_key(app_handle.clone())?;
    app_handle
        .db(|db| queries::add_connection(db, &conn, key))
        .map_err(Error::from)
}

#[command]
pub fn update_connection(
    app_handle: AppHandle,
    id: String,
    dialect: Dialect,
    mode: Mode,
    credentials: Credentials,
    name: &str,
    color: &str,
    metadata: Metadata,
) -> CommandResult<()> {
    info!("Update connection: {name}, {dialect}, {mode}, {color}");
    let conn = ConnectionConfig::new(dialect, mode, credentials, name, color, metadata)?;
    let key = get_app_key(app_handle.clone())?;
    app_handle
        .db(|db| queries::update_connection(db, id, &conn, key))
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
    metadata: Metadata,
) -> CommandResult<()> {
    info!("Test connection: {name}, {dialect}, {mode}, {color}");
    let config = ConnectionConfig::new(dialect, mode, credentials, name, color, metadata)?;
    let conn = init_conn(config, app_handle.clone()).await?;
    app_handle.connect(&conn.clone())?;
    let id = conn.config.id.clone().to_string();
    cancel_task_token(app_handle.clone(), vec![id.to_string()]).await?;
    app_handle.disconnect(&id)?;
    Ok(())
}

#[command]
pub fn delete_connection(app_handle: AppHandle, id: String) -> CommandResult<()> {
    info!("Delete connection: {id}");
    let id = uuid::Uuid::parse_str(id.as_str()).map_err(Error::from)?;
    app_handle
        .db(|db| queries::delete_connection(db, &id))
        .map_err(Error::from)
}

#[command]
pub fn get_connections(app_handle: AppHandle) -> CommandResult<Vec<ConnectionConfig>> {
    let key = get_app_key(app_handle.clone())?;
    app_handle
        .db(|db| queries::get_all_connections(db, key))
        .map_err(Error::from)
}

#[command]
pub async fn init_connection(
    mut app_handle: AppHandle,
    config: ConnectionConfig,
) -> CommandResult<String> {
    let name = config.name.clone();
    let dialect = config.dialect.clone();
    let mode = config.mode.clone();
    info!("Init connection: {name}, {dialect}, {mode}");
    let key = get_app_key(app_handle.clone())?;
    app_handle.db(|db| queries::get_connection(db, &config.id.to_string(), &key))?;
    let conn = init_conn(config.clone(), app_handle.clone()).await;
    match conn {
        Ok(c) => match app_handle.connect(&c) {
            Ok(schema) => Ok(schema),
            Err(_) => {
                cancel_task_token(app_handle.clone(), vec![config.id.to_string()]).await?;
                Err(anyhow!("Failed to connect to the database").into())
            }
        },
        Err(_) => {
            cancel_task_token(app_handle.clone(), vec![config.id.to_string()]).await?;
            Err(anyhow!("Failed to connect to the database").into())
        }
    }
}

#[command]
pub async fn disconnect(mut app_handle: AppHandle, id: &str) -> CommandResult<()> {
    info!("Disconnect: {id}");
    cancel_task_token(app_handle.clone(), vec![id.to_string()]).await?;
    app_handle.disconnect(id)?;
    Ok(())
}

#[command]
pub async fn set_schema(
    mut app_handle: AppHandle,
    conn_id: String,
    schema: String,
) -> CommandResult<()> {
    info!("Set schema: {conn_id}, {schema}");
    let conn = app_handle.acquire_connection(conn_id.clone());
    let conn = conn.set_schema(schema.clone());
    cancel_task_token(app_handle.clone(), vec![conn.config.id.to_string()]).await?;
    app_handle.clone().disconnect(&conn.config.id.to_string())?;
    let conn = init_conn(conn.config.clone(), app_handle.clone()).await;
    match conn {
        Ok(c) => match app_handle.connect(&c) {
            Ok(schema) => {
                app_handle.db(|db| queries::update_connection_schema(db, &conn_id, &schema))?;
                Ok(app_handle.update_connection(c)?)
            }
            Err(_) => {
                cancel_task_token(app_handle.clone(), vec![conn_id.to_string()]).await?;
                Err(anyhow!("Failed to connect to the database").into())
            }
        },
        Err(_) => {
            cancel_task_token(app_handle.clone(), vec![conn_id.to_string()]).await?;
            Err(anyhow!("Failed to connect to the database").into())
        }
    }
}
