use super::fs::{create_app_dir, is_appdir_populated};
use crate::{database::init::initialize_database, state::AppState, utils::fs::create_app_key};
use anyhow::Result;
use log::{LevelFilter, Record};
use std::fmt::Arguments;
use tauri::{App, Manager, State};
use tauri_plugin_log::{
    fern::{
        colors::{Color, ColoredLevelConfig},
        FormatCallback,
    },
    LogTarget,
};

#[cfg(debug_assertions)]
const LOG_TARGETS: [LogTarget; 3] = [LogTarget::Stdout, LogTarget::Webview, LogTarget::LogDir];

#[cfg(not(debug_assertions))]
const LOG_TARGETS: [LogTarget; 2] = [LogTarget::Stdout, LogTarget::LogDir];

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
    tauri_plugin_log::Builder::default()
        .format(format)
        .level(LevelFilter::Info)
        .targets(LOG_TARGETS)
}

pub fn app_setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let _window = app.get_window("main").unwrap();

    init_app()?;
    let handle = app.handle();

    let app_state: State<AppState> = handle.state();
    let db = initialize_database().expect("Database initialize should succeed");
    *app_state.db.lock().expect("Failed to lock db") = Some(db);

    Ok(())
}

fn init_app() -> Result<()> {
    if !is_appdir_populated() {
        create_app_dir()?;
        create_app_key()?;
    }
    Ok(())
}
