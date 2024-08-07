use crate::{database::QueryType, engine::types::result::ResultSet};
use anyhow::Result;
use fs::metadata;
use serde_json::json;
use std::{fs, path::PathBuf};
use tauri::api::{dir::with_temp_dir, path::app_config_dir};
use log::error;

use rand::{distributions::Alphanumeric, Rng};

pub fn get_db_path() -> PathBuf {
    let app_path = get_app_path();
    PathBuf::from(format!(
        "{}/.app.db",
        app_path.to_str().expect("Failed to get app path")
    ))
}

fn get_key_path() -> PathBuf {
    PathBuf::from(format!(
        "{}/._",
        get_app_path().to_str().expect("Failed to get app path")
    ))
}

pub fn read_key() -> Result<Vec<u8>> {
    let key_path = get_key_path();
    Ok(fs::read(key_path)?)
}

pub fn create_app_key() -> Result<()> {
    let key_path = get_key_path();
    let key: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    Ok(fs::write(key_path, key)?)
}

pub fn get_tmp_dir() -> Result<String> {
    let mut temp_dir = PathBuf::from("");
    with_temp_dir(|dir| {
        temp_dir = PathBuf::from(dir.path());
    })?;
    let res = fs::create_dir(temp_dir.clone());
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    return Ok(temp_dir.to_str().unwrap_or("").to_string());
}

pub fn get_app_path() -> PathBuf {
    let config = tauri::Config::default();
    let config_dir = app_config_dir(&config).expect("Failed to get app config dir");
    let path = PathBuf::from(config_dir.to_str().expect("Failed to get dir").to_string() + "noir");
    path
}

pub fn is_appdir_populated() -> bool {
    let key_path = get_key_path();
    let db_path = get_db_path();
    metadata(key_path).is_ok() && metadata(db_path).is_ok()
}

pub fn create_app_dir() -> Result<()> {
    let dir = get_app_path();
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

pub fn write_query(id: &str, result_set: &ResultSet, query_type: QueryType) -> Result<String> {
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
    let tmp_dir = get_tmp_dir()?;
    let path = tmp_dir.clone() + "/" + id;
    let metadata_path = tmp_dir + "/" + id + ".metadata";
    write_file(&PathBuf::from(&path), &rows)?;
    write_file(&PathBuf::from(&metadata_path), &metadata)?;
    Ok(path)
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
