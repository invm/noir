use crate::{database::QueryType, engine::types::result::ResultSet};
use anyhow::Result;
use fs::metadata;
use log::error;
use serde_json::json;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

use rand::{distributions::Alphanumeric, Rng};

pub fn get_db_path(app: AppHandle) -> PathBuf {
    let app_path = get_app_path(app);
    PathBuf::from(format!(
        "{}/.app.db",
        app_path.to_str().expect("Failed to get app path")
    ))
}

fn get_key_path(app: AppHandle) -> PathBuf {
    PathBuf::from(format!(
        "{}/._",
        get_app_path(app).to_str().expect("Failed to get app path")
    ))
}

pub fn read_key(app: AppHandle) -> Result<Vec<u8>> {
    let key_path = get_key_path(app);
    Ok(fs::read(key_path)?)
}

pub fn create_app_key(app: AppHandle) -> Result<()> {
    let key_path = get_key_path(app);
    let key: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    Ok(fs::write(key_path, key)?)
}

pub fn get_tmp_dir(app: AppHandle) -> Result<String> {
    let temp_dir = app.path().temp_dir()?;
    let res = fs::create_dir(temp_dir.clone());
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    return Ok(temp_dir.to_str().unwrap_or("").to_string());
}

pub fn get_app_path(app: AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .expect("Failed to get app config dir")
}

pub fn is_appdir_populated(app: AppHandle) -> bool {
    let key_path = get_key_path(app.clone());
    let db_path = get_db_path(app);
    metadata(key_path).is_ok() && metadata(db_path).is_ok()
}

pub fn create_app_dir(app: AppHandle) -> Result<()> {
    let dir = get_app_path(app);
    Ok(fs::create_dir_all(dir)?)
}

pub fn paginate_file(path: &str, page: usize, limit: usize) -> Result<Vec<String>> {
    let file = fs::read_to_string(path)?;
    let lines = file
        .lines()
        .skip(page * limit)
        .take(limit)
        .map(|s| s.to_string())
        .collect();
    Ok(lines)
}

pub fn write_file(path: &PathBuf, content: &str) -> Result<()> {
    let res = fs::write(path, content);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}

pub fn write_query(
    id: &str,
    result_set: &ResultSet,
    query_type: QueryType,
    tmp_dir: PathBuf,
) -> Result<String> {
    let mut rows = String::from("");
    result_set.rows.iter().for_each(|row| {
        rows += &(row.to_string() + "\n");
    });
    let metadata = json!({
        "query_type": query_type.to_string(),
        "start_time": result_set.start_time,
        "end_time": result_set.end_time,
        "count": result_set.rows.len(),
        "affected_rows": result_set.affected_rows,
        "table": result_set.table.table,
        "foreign_keys": result_set.table.foreign_keys,
        "primary_key": result_set.table.primary_key,
        "columns": result_set.table.columns,
    })
    .to_string();
    let mut data_path = tmp_dir.clone();
    data_path.push(id);
    let mut metadata_path = tmp_dir;
    metadata_path.push(id.to_string() + ".metadata");
    write_file(&data_path, &rows)?;
    write_file(&metadata_path, &metadata)?;
    let path = data_path
        .to_str()
        .expect("Could not convert data_path to path string");
    Ok(path.to_string())
}

pub fn copy_file(src: &str, dest: &str) -> Result<()> {
    let res = fs::copy(src, dest);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}

pub fn remove_dir(file_path: &str) -> Result<()> {
    let file_path = PathBuf::from(file_path);
    let dir = file_path.parent().expect("Failed to get parent dir");
    let res = fs::remove_dir_all(dir);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}
