// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use noir::utils::init::{app_setup, init_logger};
use state::AppState;
use tauri::Emitter;

use noir::{
    handlers::{connections, queries, task},
    state::{self},
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(init_logger().build())
        .manage(AppState::default())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit("single-instance", Payload { args: argv, cwd })
                .expect("failed to emit");
        }))
        .setup(app_setup)
        .invoke_handler(tauri::generate_handler![
            connections::test_connection,
            connections::add_connection,
            connections::update_connection,
            connections::delete_connection,
            connections::get_connections,
            connections::init_connection,
            connections::disconnect,
            connections::set_schema,
            queries::sql_to_statements,
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
