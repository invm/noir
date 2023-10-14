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
    return Ok(temp_dir.to_str().unwrap().to_string());
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
    format!("{}/query-noir", path)
}

pub fn check_if_app_dir_exists(app_path: &str) -> bool {
    fs::metadata(app_path).is_ok()
}

pub fn create_app_dir(dir: &String) -> Result<()> {
    Ok(fs::create_dir_all(dir)?)
}

pub fn create_app_config(app_path: &String) -> Result<()> {
    let config_path = format!("{}/config.yaml", app_path);
    let config = r#""#;
    Ok(fs::write(config_path, config)?)
}

pub fn paginate_file(path: &str, page: usize, limit: usize) -> Vec<String> {
    let file = fs::read_to_string(path).expect("Error reading file");
    let lines = file.lines().skip(page * limit).take(limit);
    return lines.into_iter().map(|s| s.to_string()).collect();
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

pub fn write_query(id: &str, result_set: ResultSet) -> Result<String> {
    let rows = json!(result_set.rows).to_string();
    let metadata = json!({
        "count": result_set.rows.len(),
        "affected_rows": result_set.affected_rows,
        "warnings": result_set.warnings,
        "info": result_set.info,
    })
    .to_string();
    let tmp_dir = get_tmp_dir()?;
    let path = tmp_dir.clone() + "/" + id;
    let metadata_path = tmp_dir + "/" + id + ".metadata";
    write_file(&PathBuf::from(&path), &rows)?;
    write_file(&PathBuf::from(&metadata_path), &metadata)?;
    Ok(path)
}
