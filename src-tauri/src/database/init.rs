use crate::utils::fs::get_db_path;
use log::error;
use sqlx::sqlite::SqlitePool;
use tauri::AppHandle;

/// Initializes the database connection pool, creating the .sqlite file if needed,
/// and running migrations.
pub async fn initialize_database(app: AppHandle) -> Result<SqlitePool, sqlx::Error> {
    let db_path = get_db_path(app);
    let db_url = format!("sqlite:{}?mode=rwc", db_path);
    let pool = SqlitePool::connect(&db_url).await?;

    sqlx::migrate!().run(&pool).await.map_err(|e| {
        error!("Error applying migrations: {:?}", e);
        e
    })?;

    Ok(pool)
}
