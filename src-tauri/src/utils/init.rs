use std::{fs, path::PathBuf};

use crate::database::database::create_app_db;
use anyhow::Result;
use tauri::api::dir::with_temp_dir;
use tracing::{debug, error};

use super::{
    crypto::create_app_key,
    fs::{check_if_app_dir_exists, create_app_config, create_app_dir, get_app_path},
};

pub fn get_tmp_dir() -> Result<String> {
    let mut temp_dir = PathBuf::from("/tmp/.noir");
    with_temp_dir(|dir| {
        temp_dir = PathBuf::from(dir.path());
        return ();
    })?;
    let res = fs::create_dir(temp_dir.clone());
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    return Ok(temp_dir.to_str().unwrap().to_string());
}

pub fn init_app() -> Result<()> {
    // clear this shit
    let app_path = get_app_path();
    if !check_if_app_dir_exists(&app_path) {
        create_app_dir(&app_path)?;
        create_app_config(&app_path)?;
        create_app_key()?;
        create_app_db(&app_path)?;
    }
    Ok(())
}

pub fn write_file(path: &PathBuf, content: &str) -> Result<()> {
    // let file_path = temp_dir.join(file_name);
    debug!("Writing to file: {:?}", path);
    let res = fs::write(&path, content);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}
