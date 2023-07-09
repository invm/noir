use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

use crate::database::connections::ConnectedConnection;

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
    pub connections: Mutex<Vec<ConnectedConnection>>,
}

pub trait ServiceAccess {
    fn db<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&Connection) -> TResult;

    fn db_mut<F, TResult>(&self, operation: F) -> TResult
    where
        F: FnOnce(&mut Connection) -> TResult;

    fn connections<F, TResult>(&self) -> Mutex<Vec<ConnectedConnection>>;
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

    fn connections<F, TResult>(&self) -> Mutex<Vec<ConnectedConnection>> {
        let app_state: State<AppState> = self.state();
        let connections_guard = app_state.connections.lock().unwrap();

        connections_guard.clone().into()
    }
}
