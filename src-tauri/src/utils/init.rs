use super::fs::{create_app_dir, get_app_path, is_appdir_populated};
use crate::{database::init::initialize_database, state::AppState, utils::fs::create_app_key};
use anyhow::Result;
use log::{LevelFilter, Record};
use std::fmt::Arguments;
use std::{fs, panic};
use tauri::{App, AppHandle, Manager};
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
        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown".to_string()
        };
        let location = info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown location".to_string());
        let backtrace = std::backtrace::Backtrace::force_capture();
        let filtered_bt: String = backtrace
            .to_string()
            .lines()
            .filter(|l| l.contains("noir::") || l.contains("/src/"))
            .collect::<Vec<_>>()
            .join("\n");
        log::error!("Panicked at {location}: {payload}\n{filtered_bt}");
        let ts = chrono::offset::Utc::now();
        let log_path = dest.join("error.log");
        fs::write(
            log_path,
            format!("{ts} - Panicked at {location}: {payload}\n{backtrace}"),
        )
        .expect("Failed to write error log");
    }));

    #[cfg(desktop)]
    app.handle()
        .plugin(tauri_plugin_window_state::Builder::default().build())?;

    let _window = app.get_webview_window("main").unwrap();
    init_app(app.handle())?;
    let handle = app.handle().clone();

    let rt = tokio::runtime::Handle::current();
    let pool = rt
        .block_on(initialize_database(handle))
        .expect("Database initialize should succeed");

    let app_state = app.state::<AppState>();
    app_state
        .db
        .set(pool)
        .expect("Database pool already initialized");

    Ok(())
}

fn init_app(app: &AppHandle) -> Result<()> {
    if !is_appdir_populated(app.clone()) {
        create_app_dir(app.clone())?;
        create_app_key(app.clone())?;
    }
    Ok(())
}
