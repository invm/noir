use anyhow::Result;
use log::error;
use rusqlite::Connection;
use std::{collections::HashMap, sync::Mutex};
use tauri::{AppHandle, Manager, State};

use crate::database::connections::ConnectedConnection;

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
    pub connections: Mutex<HashMap<String, ConnectedConnection>>,
}

pub trait ServiceAccess {
    fn db<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&Connection) -> TResult;

    fn db_mut<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&mut Connection) -> TResult;

    fn acquire_connection(&self, conn_id: String) -> ConnectedConnection;
    fn add_connection(&mut self, conn: ConnectedConnection) -> Result<()>;
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

    fn acquire_connection(&self, conn_id: String) -> ConnectedConnection {
        let app_state: State<AppState> = self.state();
        let binding = app_state.connections.lock();
        let connection_guard = binding.as_ref();
        let connection = connection_guard.unwrap().get(&conn_id).unwrap();

        return connection.clone();
    }

    fn add_connection(&mut self, conn: ConnectedConnection) -> Result<()> {
        let app_state: State<AppState> = self.state();
        let mut binding = app_state.connections.lock();
        let connection_guard = binding.as_mut();
        match connection_guard {
            Ok(connection_guard) => {
                connection_guard.insert(conn.config.id.to_string().clone(), conn);
            }
            Err(e) => error!("Error: {}", e),
        }

        Ok(())
    }
}
