use super::fs::{create_app_dir, get_app_path, is_appdir_populated};
use crate::{database::init::initialize_database, state::AppState, utils::fs::create_app_key};
use anyhow::Result;
use log::{LevelFilter, Record};
use std::fmt::Arguments;
use std::{fs, panic};
use tauri::{App, AppHandle, Manager, State};
use tauri_plugin_log::fern::{
    colors::{Color, ColoredLevelConfig},
    FormatCallback,
};
use tauri_plugin_log::{Target, TargetKind};

fn format(out: FormatCallback, message: &Arguments, record: &Record) {
    let colors = ColoredLevelConfig::default().info(Color::BrightGreen);
    let mut target = record.target();
    if target.starts_with("log@") {
        target = "frontend"
    } else {
        target = target.split("::").last().unwrap_or(target)
    }
    let mut target = String::from(target);
    target.truncate(10);
    let target = format!("{:<10}", target);
    // time in date - time foramt with seconds
    let ts = chrono::offset::Utc::now()
        .format("%Y-%m-%d %H:%M:%S%.3f")
        .to_string();
    out.finish(format_args!(
        "[{}] [{}] [{}] - {}",
        ts,
        colors.color(record.level()),
        target.as_str(),
        message
    ))
}

pub fn init_logger() -> tauri_plugin_log::Builder {
    let log = Target::new(TargetKind::LogDir {
        file_name: Some("rust".to_string()),
    });
    #[cfg(debug_assertions)]
    let log_targets: [Target; 3] = [
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::Webview),
        log,
    ];

    #[cfg(not(debug_assertions))]
    let log_targets: [Target; 2] = [Target::new(TargetKind::Stdout), log];

    tauri_plugin_log::Builder::default()
        .format(format)
        .level(LevelFilter::Info)
        .targets(log_targets)
}

pub fn app_setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let dest = get_app_path(app.handle());
    panic::set_hook(Box::new(move |info| {
        log::error!("Panicked: {:?}", info);
        let ts = chrono::offset::Utc::now();
        let log_path = dest.join("error.log");
        fs::write(log_path, format!("{} - {:?}", ts, info)).expect("Failed to write error log");
    }));

    #[cfg(desktop)]
    app.handle()
        .plugin(tauri_plugin_window_state::Builder::default().build())?;

    let _window = app.get_webview_window("main").unwrap();
    init_app(app.handle())?;
    let handle = app.handle();

    let app_state: State<AppState> = handle.state();
    let db = initialize_database(app.handle().clone()).expect("Database initialize should succeed");
    *app_state.db.lock().expect("Failed to lock db") = Some(db);

    Ok(())
}

fn init_app(app: &AppHandle) -> Result<()> {
    if !is_appdir_populated(app.clone()) {
        create_app_dir(app.clone())?;
        create_app_key(app.clone())?;
    }
    Ok(())
}
