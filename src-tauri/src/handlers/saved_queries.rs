use crate::{
    state::ServiceAccess,
    utils::error::CommandResult,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::{command, AppHandle};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
pub struct SavedQuery {
    pub id: String,
    pub name: String,
    pub query: String,
    pub created_at: i64,
}

#[command]
pub async fn save_query(
    app_handle: AppHandle,
    name: String,
    query: String,
) -> CommandResult<String> {
    let pool = app_handle.db();
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO saved_queries (id, name, query) VALUES ($1, $2, $3)
         ON CONFLICT(name) DO UPDATE SET query = $3",
    )
    .bind(&id)
    .bind(&name)
    .bind(&query)
    .execute(pool)
    .await?;
    Ok(id)
}

#[command]
pub async fn get_saved_queries(app_handle: AppHandle) -> CommandResult<Vec<SavedQuery>> {
    let pool = app_handle.db();
    let rows = sqlx::query("SELECT * FROM saved_queries ORDER BY created_at DESC")
        .fetch_all(pool)
        .await?;
    let queries = rows
        .iter()
        .map(|row| SavedQuery {
            id: row.get("id"),
            name: row.get("name"),
            query: row.get("query"),
            created_at: row.get("created_at"),
        })
        .collect();
    Ok(queries)
}

#[command]
pub async fn delete_saved_query(app_handle: AppHandle, id: String) -> CommandResult<()> {
    let pool = app_handle.db();
    sqlx::query("DELETE FROM saved_queries WHERE id = $1")
        .bind(&id)
        .execute(pool)
        .await?;
    Ok(())
}
