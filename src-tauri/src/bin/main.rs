// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono;
use log::error;
use state::AppState;
use std::{fs, panic};
use tauri::{Manager, State};
use tokio::sync::mpsc;
use tokio::sync::Mutex;
use tracing_subscriber;

use query_noir::{
    database::queries::initialize_database,
    handlers::{connections, queries},
    queues::query::{async_process_model, rs2js},
    state::{self, AsyncState},
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
        fs::write(
            format!("{}/error.log", path),
            format!("{} - {:?}", ts, info),
        )
        .unwrap();
    }));

    let (async_proc_input_tx, async_proc_input_rx) = mpsc::channel(1);
    let (async_proc_output_tx, mut async_proc_output_rx) = mpsc::channel(1);

    tauri::Builder::default()
        .manage(AsyncState {
            tasks: Mutex::new(async_proc_input_tx),
            connections: Default::default(),
        })
        .manage(AppState {
            db: Default::default(),
            connections: Default::default(),
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .setup(|app| {
            init::init_app()?;
            let handle = app.handle();

            let app_state: State<AppState> = handle.state();
            let db = initialize_database().expect("Database initialize should succeed");
            *app_state.db.lock().unwrap() = Some(db);

            tauri::async_runtime::spawn(async move {
                async_process_model(async_proc_input_rx, async_proc_output_tx).await
            });

            tauri::async_runtime::spawn(async move {
                loop {
                    if let Some(output) = async_proc_output_rx.recv().await {
                        rs2js(output, &handle).await
                    }
                }
            });

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
            queries::get_columns,
            queries::get_constraints,
            queries::get_functions,
            queries::get_procedures,
            queries::get_triggers,
            queries::get_table_structure,
            queries::get_query_metadata,
            queries::query_results,
            queries::get_schemas,
            queries::get_views,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
