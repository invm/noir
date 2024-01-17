use crate::database::types::result::ResultSet;
use anyhow::Result;
use serde_json::json;
use std::{fs, path::PathBuf};
use tauri::api::{dir::with_temp_dir, path::app_config_dir};
use tracing::error;

pub fn get_tmp_dir() -> Result<String> {
    let mut temp_dir = PathBuf::from("");
    with_temp_dir(|dir| {
        temp_dir = PathBuf::from(dir.path());
        return ();
    })?;
    let res = fs::create_dir(temp_dir.clone());
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    return Ok(temp_dir.to_str().unwrap_or("").to_string());
}

pub fn get_app_path() -> PathBuf {
    let config = tauri::Config::default();
    let config_dir = app_config_dir(&config).unwrap();
    let path = PathBuf::from(config_dir.to_str().unwrap().to_string() + "noir");
    path
}

pub fn check_if_app_dir_exists(app_path: &PathBuf) -> bool {
    fs::metadata(app_path).is_ok()
}

pub fn create_app_dir(dir: &PathBuf) -> Result<()> {
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
    return Ok(lines);
}

pub fn write_file(path: &PathBuf, content: &str) -> Result<()> {
    let res = fs::write(&path, content);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}

pub fn write_query(id: &str, result_set: &ResultSet) -> Result<String> {
    let mut rows = String::from("");
    result_set.rows.iter().for_each(|row| {
        rows += &(row.to_string() + "\n");
    });
    let metadata = json!({
        "count": result_set.rows.len(),
        "affected_rows": result_set.affected_rows,
        "warnings": result_set.warnings,
        "info": result_set.info,
        "table": result_set.table.table,
        "constraints": result_set.table.constraints,
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
    let dir = file_path.parent().unwrap();
    let res = fs::remove_dir_all(dir);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}
