use crate::database::connections::ResultSet;
use anyhow::Result;
use serde_json::json;
use std::{fs, path::PathBuf};
use tauri::api::dir::with_temp_dir;
use tracing::{debug, error};

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
    return Ok(temp_dir.to_str().unwrap_or("").to_string());
}

pub fn get_app_path() -> String {
    let xdg_path = std::env::var("XDG_CONFIG_HOME");
    let xdg_path = match xdg_path {
        Ok(path) => path,
        Err(_) => "".to_string(),
    };
    let home = std::env!("HOME").to_string();
    let path = if !xdg_path.is_empty() {
        xdg_path
    } else {
        format!("{}/.config", home)
    };
    debug!("get_app_path: {}/noir", path);
    format!("{}/noir", path)
}

pub fn check_if_app_dir_exists(app_path: &str) -> bool {
    fs::metadata(app_path).is_ok()
}

pub fn create_app_dir(dir: &String) -> Result<()> {
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
    // let file_path = temp_dir.join(file_name);
    debug!("Writing to file: {:?}", path);
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
    debug!("Copying file: {:?} to {:?}", src, dest);
    let res = fs::copy(src, dest);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}

pub fn remove_dir(file_path: &str) -> Result<()> {
    let file_path = PathBuf::from(file_path);
    let dir = file_path.parent().unwrap();
    debug!("Removing dir: {:?}", dir);
    let res = fs::remove_dir_all(dir);
    if let Err(res) = res {
        error!("Error: {:?}", res);
    }
    Ok(())
}
