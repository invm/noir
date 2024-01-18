use anyhow::Result;
use tracing::debug;

use crate::{database::queries::create_app_db, utils::fs::create_app_key};

use super::fs::{create_app_dir, is_appdir_populated};

pub fn init_app() -> Result<()> {
    if !is_appdir_populated() {
        debug!("appdir is not populated");
        create_app_dir()?;
        create_app_key()?;
        create_app_db()?;
    }
    Ok(())
}
