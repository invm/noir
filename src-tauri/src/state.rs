use anyhow::Result;
use deadpool_sqlite::rusqlite::Connection;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State};
use tokio::sync::{mpsc, Mutex};
use tracing::error;

use crate::{engine::types::connection::InitiatedConnection, queues::query::QueryTask};

pub struct AppState {
    pub db: std::sync::Mutex<Option<Connection>>,
    pub connections: std::sync::Mutex<HashMap<String, InitiatedConnection>>,
}

pub struct AsyncState {
    pub tasks: Mutex<mpsc::Sender<QueryTask>>,
    pub connections: Mutex<HashMap<String, InitiatedConnection>>,
}

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
    fn connect(&mut self, conn: &InitiatedConnection) -> Result<()>;
}

impl ServiceAccess for AppHandle {
    fn db<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&Connection) -> TResult,
    {
        let app_state: State<AppState> = self.state();
        let db_connection_guard = app_state.db.lock().unwrap();
        let db = db_connection_guard.as_ref().unwrap();

        operation(db)
    }

    fn db_mut<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&mut Connection) -> TResult,
    {
        let app_state: State<AppState> = self.state();
        let mut db_connection_guard = app_state.db.lock().unwrap();
        let db = db_connection_guard.as_mut().unwrap();

        operation(db)
    }

    fn acquire_connection(&self, conn_id: String) -> InitiatedConnection {
        let app_state: State<AppState> = self.state();
        let binding = app_state.connections.lock();
        let connection_guard = binding.as_ref();
        let connection = connection_guard.unwrap().get(&conn_id).unwrap();

        return connection.clone();
    }

    fn connect(&mut self, conn: &InitiatedConnection) -> Result<()> {
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
}
