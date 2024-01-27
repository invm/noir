use anyhow::Result;

use crate::utils::fs::create_app_key;

use super::fs::{create_app_dir, is_appdir_populated};

pub fn init_app() -> Result<()> {
    if !is_appdir_populated() {
        create_app_dir()?;
        create_app_key()?;
    }
    Ok(())
}
