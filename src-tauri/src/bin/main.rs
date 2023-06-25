// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use query_noir::{database::database, handlers::connections, state, utils::init};

use state::AppState;
use tauri::{Manager, State};

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            db: Default::default(),
        })
        .setup(|app| {
            init::init_app()?;
            let handle = app.handle();

            let app_state: State<AppState> = handle.state();
            let db = database::initialize_database().expect("Database initialize should succeed");
            *app_state.db.lock().unwrap() = Some(db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connections::add_connection,
            // connections::get_all_connections,
            // connections::delete_connection,
            // connections::update_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
