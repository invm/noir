use anyhow::Result;
use std::{fs, path::Path};

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

pub fn paginate_file(path: &Path, page: usize, limit: usize) -> Vec<String> {
    let file = fs::read_to_string(path).expect("Error reading file");
    let lines = file.lines().skip(page * limit).take(limit);
    return lines.into_iter().map(|s| s.to_string()).collect();
}

// fn main() {
//     let path = "input.txt";
//     let limit = 2;
//     let page = 4;
//     let lines = paginate_file(Path::new(path), page, limit);
//
//     for line in lines {
//         println!("{}", line);
//     }
// }
//
