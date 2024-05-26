// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use state::AppState;
use std::path::PathBuf;
use std::{fs, panic};
use tauri::{Manager, State};
use tracing::error;

use noir::{
    database::init::initialize_database,
    handlers::{connections, queries, task},
    state::{self},
    utils::{fs::get_app_path, init},
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tracing_subscriber::fmt::init();

    panic::set_hook(Box::new(|info| {
        error!("Panicked: {:?}", info);
        let path = get_app_path();
        let ts = chrono::offset::Utc::now();
        let dest = format!("{}/error.log", path.to_str().expect("Failed to get path"));
        fs::write(PathBuf::from(dest), format!("{} - {:?}", ts, info))
            .expect("Failed to write error log");
    }));

    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .expect("failed to emit");
        }))
        .setup(|app| {
            init::init_app()?;
            let handle = app.handle();

            let app_state: State<AppState> = handle.state();
            let db = initialize_database().expect("Database initialize should succeed");
            *app_state.db.lock().expect("Failed to lock db") = Some(db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connections::test_connection,
            connections::add_connection,
            connections::delete_connection,
            connections::get_connections,
            connections::init_connection,
            connections::disconnect,
            connections::set_schema,
            queries::execute_query,
            queries::enqueue_query,
            queries::execute_tx,
            queries::get_columns,
            queries::get_foreign_keys,
            queries::get_primary_key,
            queries::get_functions,
            queries::get_procedures,
            queries::get_triggers,
            queries::get_table_structure,
            queries::get_query_metadata,
            queries::query_results,
            queries::get_schemas,
            queries::get_views,
            queries::download_json,
            queries::download_csv,
            queries::invalidate_query,
            task::cancel_task_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
