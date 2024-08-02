use anyhow::Result;
use deadpool_sqlite::rusqlite::Connection;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use log::error;

use crate::engine::types::connection::InitiatedConnection;

#[derive(Default)]
pub struct AppState {
    pub db: std::sync::Mutex<Option<Connection>>,
    pub connections: std::sync::Mutex<HashMap<String, InitiatedConnection>>,
    pub cancel_tokens: Mutex<HashMap<String, CancellationToken>>,
}

#[allow(async_fn_in_trait)]
pub trait ServiceAccess {
    fn db<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&Connection) -> TResult;

    fn db_mut<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&mut Connection) -> TResult;

    fn acquire_connection(&self, conn_id: String) -> InitiatedConnection;
    fn update_connection(&self, conn: InitiatedConnection) -> Result<()>;
    fn disconnect(&mut self, conn_id: &str) -> Result<()>;
    fn connect(&mut self, conn: &InitiatedConnection) -> Result<String>;
    async fn cancel_token(&self, id: String) -> Result<()>;
}

impl ServiceAccess for AppHandle {
    fn db<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&Connection) -> TResult,
    {
        let app_state: State<AppState> = self.state();
        let db_connection_guard = app_state.db.lock().expect("Failed to lock db");
        let db = db_connection_guard
            .as_ref()
            .expect("Connection not initialized");

        operation(db)
    }

    fn db_mut<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&mut Connection) -> TResult,
    {
        let app_state: State<AppState> = self.state();
        let mut db_connection_guard = app_state.db.lock().expect("Failed to lock db");
        let db = db_connection_guard
            .as_mut()
            .expect("Connection not initialized");

        operation(db)
    }

    fn acquire_connection(&self, conn_id: String) -> InitiatedConnection {
        let app_state: State<AppState> = self.state();
        let binding = app_state.connections.lock();
        let connection_guard = binding.as_ref();
        let connection = connection_guard
            .expect("Failed to get db binding")
            .get(&conn_id)
            .expect("Failed to get connection");

        connection.clone()
    }

    fn connect(&mut self, conn: &InitiatedConnection) -> Result<String> {
        let app_state: State<AppState> = self.state();
        let mut binding = app_state.connections.lock();
        let connection_guard = binding.as_mut();
        match connection_guard {
            Ok(connection_guard) => {
                connection_guard.insert(conn.config.id.to_string().clone(), conn.clone());
            }
            Err(e) => error!("Error: {}", e),
        }
        Ok(conn.get_schema())
    }

    fn disconnect(&mut self, conn_id: &str) -> Result<()> {
        let app_state: State<AppState> = self.state();
        let mut binding = app_state.connections.lock();
        let connection_guard = binding.as_mut();
        match connection_guard {
            Ok(connection_guard) => {
                connection_guard.remove(conn_id);
            }
            Err(e) => error!("Error: {}", e),
        }
        Ok(())
    }

    fn update_connection(&self, conn: InitiatedConnection) -> Result<()> {
        let app_state: State<AppState> = self.state();
        let mut binding = app_state.connections.lock();
        let connection_guard = binding.as_mut();
        match connection_guard {
            Ok(connection_guard) => {
                connection_guard.insert(conn.config.id.to_string().clone(), conn.clone());
            }
            Err(e) => error!("Error: {}", e),
        }
        Ok(())
    }

    async fn cancel_token(&self, id: String) -> Result<()> {
        let state: State<AppState> = self.state();
        let mut binding = state.cancel_tokens.lock().await;
        let token = binding.get(&id);
        if let Some(token) = token {
            token.cancel();
            binding.remove(&id);
        }
        Ok(())
    }
}
