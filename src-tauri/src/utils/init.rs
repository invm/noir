use crate::database::database::create_app_db;
use anyhow::Result;

use super::{
    crypto::create_app_key,
    fs::{check_if_app_dir_exists, create_app_config, create_app_dir, get_app_path},
};

pub fn init_app() -> Result<()> {
    let app_path = get_app_path();
    env_logger::init();
    if !check_if_app_dir_exists(&app_path) {
        create_app_dir(&app_path)?;
        create_app_config(&app_path)?;
        create_app_key()?;
        create_app_db(&app_path)?;
    }
    Ok(())
}
