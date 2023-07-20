// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use query_noir::{
    database::database,
    handlers::{connections, queries},
    state,
    utils::init,
};

use state::AppState;
use tauri::{Manager, State};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .manage(AppState {
            db: Default::default(),
            connections: Default::default(),
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
            connections::delete_connection,
            connections::get_connections,
            queries::execute_query,
            queries::get_columns,
            queries::get_constraints,
            queries::get_functions,
            queries::get_procedures,
            queries::get_triggers,
            queries::init_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
