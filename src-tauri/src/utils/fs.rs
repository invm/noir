use crate::database::app::create_app_db;
use anyhow::Result;
use std::fs;

use super::crypto::create_app_key;

pub fn init_app() -> Result<()> {
    let app_path = get_app_path();
    if !check_if_app_dir_exists(&app_path) {
        create_app_dir(&app_path)?;
        create_app_key()?;
        create_app_config(&app_path)?;
        create_app_db(&app_path)?;
    }
    Ok(())
}

pub fn get_app_path() -> String {
    let xdg_path = std::env::var("XDG_CONFIG_HOME");
    let xdg_path = match xdg_path {
        Ok(path) => path.to_string(),
        Err(_) => "".to_string(),
    };
    let home = std::env!("HOME").to_string();
    let path = if xdg_path != "" {
        xdg_path
    } else {
        format!("{}/.config", home)
    };
    return format!("{}/query-noir", path);
}

fn check_if_app_dir_exists(app_path: &str) -> bool {
    return fs::metadata(app_path).is_ok();
}

fn create_app_dir(dir: &String) -> Result<()> {
    Ok(fs::create_dir_all(dir)?)
}

fn create_app_config(app_path: &String) -> Result<()> {
    let config_path = format!("{}/config.yaml", app_path);
    let config = r#""#;
    Ok(fs::write(config_path, config)?)
}
