use crate::{
    database::QueryType,
    query::{Events, QueryTask, QueryTaskEnqueueResult, QueryTaskResult, QueryTaskStatus},
    state::{AppState, ServiceAccess},
    utils::{
        self,
        crypto::md5_hash,
        error::{CommandResult, Error},
        fs::{paginate_file, write_query},
    },
};
use anyhow::anyhow;
use log::info;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlparser::{ast::Statement, dialect::dialect_from_str, parser::Parser};
use std::str;
use std::{fs::read_to_string, path::PathBuf};
use tauri::{command, AppHandle, Manager, State};
use tokio_util::sync::CancellationToken;

fn get_query_type(s: Statement) -> QueryType {
    match s {
        Statement::AlterIndex { .. } => QueryType::Alter,
        Statement::AlterPolicy { .. } => QueryType::Alter,
        Statement::AlterRole { .. } => QueryType::Alter,
        Statement::AlterTable { .. } => QueryType::Alter,
        Statement::AlterView { .. } => QueryType::Alter,
        Statement::CreateDatabase { .. } => QueryType::Create,
        Statement::CreateExtension { .. } => QueryType::Create,
        Statement::CreateFunction { .. } => QueryType::Create,
        Statement::CreateIndex { .. } => QueryType::Create,
        Statement::CreateMacro { .. } => QueryType::Create,
        Statement::CreatePolicy { .. } => QueryType::Create,
        Statement::CreateProcedure { .. } => QueryType::Create,
        Statement::CreateRole { .. } => QueryType::Create,
        Statement::CreateSchema { .. } => QueryType::Create,
        Statement::CreateSecret { .. } => QueryType::Create,
        Statement::CreateSequence { .. } => QueryType::Create,
        Statement::CreateStage { .. } => QueryType::Create,
        Statement::CreateTable { .. } => QueryType::Create,
        Statement::CreateTrigger { .. } => QueryType::Create,
        Statement::CreateType { .. } => QueryType::Create,
        Statement::CreateView { .. } => QueryType::Create,
        Statement::CreateVirtualTable { .. } => QueryType::Create,
        Statement::Delete { .. } => QueryType::Delete,
        Statement::Drop { .. } => QueryType::Drop,
        Statement::DropExtension { .. } => QueryType::Drop,
        Statement::DropFunction { .. } => QueryType::Drop,
        Statement::DropProcedure { .. } => QueryType::Drop,
        Statement::DropSecret { .. } => QueryType::Drop,
        Statement::DropTrigger { .. } => QueryType::Drop,
        Statement::Insert { .. } => QueryType::Insert,
        Statement::Query(_) => QueryType::Select,
        Statement::Truncate { .. } => QueryType::Truncate,
        Statement::Update { .. } => QueryType::Update,
        Statement::Explain { .. }
        | Statement::Analyze { .. }
        | Statement::ShowCollation { .. }
        | Statement::ShowColumns { .. }
        | Statement::ShowCreate { .. }
        | Statement::ShowDatabases { .. }
        | Statement::ShowFunctions { .. }
        | Statement::ShowSchemas { .. }
        | Statement::ShowStatus { .. }
        | Statement::ShowTables { .. }
        | Statement::ShowVariable { .. }
        | Statement::ShowVariables { .. }
        | Statement::ShowViews { .. } => QueryType::Show,
        _ => QueryType::Other,
    }
}

// TODO: use this dialect when the fix for mysql is merged in sqlparser
#[command]
pub async fn sql_to_statements(dialect: String, sql: &str) -> CommandResult<Vec<QueryType>> {
    let statements = Parser::parse_sql(
        dialect_from_str("generic")
            .expect("Failed to get dialect")
            .as_ref(),
        sql,
    )
    .unwrap_or_default();
    if statements.is_empty() {
        return Err(Error::from(anyhow!("No valid statements found")));
    }
    Ok(statements.into_iter().map(|s| get_query_type(s)).collect())
}

#[command]
pub async fn enqueue_query(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    conn_id: String,
    tab_idx: usize,
    sql: &str,
    auto_limit: bool,
    table: Option<String>,
) -> CommandResult<QueryTaskEnqueueResult> {
    info!("Enqueue query on {conn_id}, tab:{tab_idx} - sql:{sql}");
    let conn = app_handle.acquire_connection(conn_id.clone());
    let statements = Parser::parse_sql(
        dialect_from_str(conn.config.dialect.to_string())
            .expect("Failed to get dialect")
            .as_ref(),
        sql,
    )
    .unwrap_or_default();
    if statements.is_empty() {
        return Err(Error::from(anyhow!("No valid statements found")));
    }
    let statements: Vec<(String, QueryType, String)> = statements
        .into_iter()
        .map(|s| {
            let query_type = get_query_type(s.clone());
            let mut statement = s.to_string();
            if auto_limit
                && query_type == QueryType::Select
                && ["show", "analyze", "explain", "limit"]
                    .iter()
                    .all(|k| !statement.to_lowercase().contains(k))
            {
                statement = format!("{} LIMIT 1000", statement);
            }
            let id = conn.config.id.to_string() + &tab_idx.to_string() + &statement.to_string();
            (statement, query_type, md5_hash(&id))
        })
        .collect();
    let mut binding = state.cancel_tokens.lock().await;
    for (idx, stmt) in statements.iter().enumerate() {
        let token = CancellationToken::new();
        let task = QueryTask::new(
            conn.clone(),
            stmt.to_owned(),
            tab_idx,
            idx,
            table.clone(),
            token.clone(),
        );
        binding.insert(stmt.2.clone(), token);
        let handle = app_handle.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = task.cancel_token.cancelled() => {},
                res = task.conn.execute_query(&task.query, task.query_type) => {
                    match res {
                        Ok(mut result_set) => {
                            if let Some(table) = task.table.clone() {
                                result_set.table = task.conn.get_table_metadata(&table).await.unwrap_or_default();
                            }
                            match write_query(&task.id, &result_set, task.query_type) {
                                Ok(path) => {
                                    handle
                                        .emit_all(Events::QueryFinished.as_str(), QueryTaskResult::success(task, result_set, path))
                                        .expect("Failed to emit query_finished event");
                                },
                                Err(e) =>
                                handle
                                        .emit_all(Events::QueryFinished.as_str(), QueryTaskResult::error(task, e))
                                        .expect("Failed to emit query_finished event"),
                            }
                        }
                        Err(e) =>
                            handle
                                .emit_all(Events::QueryFinished.as_str(), QueryTaskResult::error(task, e))
                                .expect("Failed to emit query_finished event"),
                    }
                }
            }
        });
    }
    Ok(QueryTaskEnqueueResult {
        conn_id,
        tab_idx,
        status: QueryTaskStatus::Progress,
        result_sets: statements.iter().map(|s| (s.2.clone())).collect(),
    })
}

#[derive(Serialize, Deserialize, Debug)]
pub struct QueryResultParams {
    pub path: String,
    pub page: usize,
    pub page_size: usize,
}

#[command]
pub async fn get_schemas(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_schemas().await?)
}

#[command]
pub async fn get_views(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_views().await?)
}

#[command]
pub async fn execute_tx(
    app_handle: AppHandle,
    conn_id: String,
    queries: Vec<&str>,
) -> CommandResult<()> {
    for query in &queries {
        info!("Execute tx on {}, sql:{query}", conn_id.clone());
    }
    let connection = app_handle.acquire_connection(conn_id);
    connection.execute_tx(queries).await?;
    Ok(())
}

#[command]
pub async fn execute_query(
    app_handle: AppHandle,
    conn_id: String,
    query: String,
) -> CommandResult<Value> {
    let conn = app_handle.acquire_connection(conn_id);
    info!("Execute query: {query}");
    let statements = Parser::parse_sql(
        dialect_from_str(conn.config.dialect.to_string())
            .expect("Failed to get dialect")
            .as_ref(),
        &query,
    )?;
    if statements.is_empty() {
        return Err(Error::from(anyhow!("No valid statements found")));
    }
    let statements: Vec<(String, QueryType, String)> = statements
        .into_iter()
        .map(|s| {
            let id = conn.config.id.to_string() + &s.to_string();
            (s.to_string(), get_query_type(s), md5_hash(&id))
        })
        .collect();
    let stmt = &statements[0];
    let result = conn.execute_query(&stmt.0, stmt.1).await?;
    Ok(json!(result))
}

#[command]
pub async fn get_query_metadata(_app_handle: AppHandle, path: String) -> CommandResult<Value> {
    let data = read_to_string(path + ".metadata");
    match data {
        Ok(data) => Ok(Value::from(data)),
        Err(..) => Err(Error::QueryExpired),
    }
}

#[command]
pub async fn query_results(
    _app_handle: AppHandle,
    params: QueryResultParams,
) -> CommandResult<Value> {
    info!("Query results: {:?}", params);
    let data = paginate_file(&params.path, params.page, params.page_size);
    match data {
        Ok(data) => Ok(Value::from(data)),
        Err(..) => Err(Error::QueryExpired),
    }
}

#[command]
pub async fn get_table_structure(
    app_handle: AppHandle,
    conn_id: String,
    table: String,
) -> CommandResult<Value> {
    let connection = app_handle.acquire_connection(conn_id);
    let result = connection.get_table_structure(table).await?;
    Ok(result)
}

#[command]
pub async fn get_columns(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_columns(None).await?)
}

#[command]
pub async fn get_primary_key(
    app_handle: AppHandle,
    conn_id: String,
    table: String,
) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_primary_key(&table).await?)
}

#[command]
pub async fn get_foreign_keys(
    app_handle: AppHandle,
    conn_id: String,
    table: String,
) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_foreign_keys(&table).await?)
}

#[command]
pub async fn get_triggers(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_triggers().await?)
}

#[command]
pub async fn get_functions(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_functions().await?)
}

#[command]
pub async fn get_procedures(app_handle: AppHandle, conn_id: String) -> CommandResult<Vec<Value>> {
    let connection = app_handle.acquire_connection(conn_id);
    Ok(connection.get_procedures().await?)
}

#[command]
pub async fn download_json(source: &str, destination: &str) -> CommandResult<()> {
    let data = read_to_string(source)?;
    let content: String = data
        .lines()
        .map(|line| format!("{},", line))
        .collect::<Vec<String>>()
        .join("\n");
    let content = content[..content.len() - 1].to_string();
    let content = format!("[\n{}\n]", content);

    Ok(utils::fs::write_file(
        &PathBuf::from(destination),
        &content,
    )?)
}

#[command]
pub async fn download_csv(source: &str, destination: &str) -> CommandResult<()> {
    let data = read_to_string(source)?;
    let content: String = data
        .lines()
        .map(|line| format!("{},", line))
        .collect::<Vec<String>>()
        .join("\n");
    let content = content[..content.len() - 1].to_string();
    let content: Vec<Value> = serde_json::from_str(&format!("[{}]", content))?;
    let keys = content[0]
        .as_object()
        .expect("Failed to get object")
        .keys()
        .map(|k| k.to_string())
        .collect::<Vec<String>>();

    let csv = keys.join(",") + "\n";
    let rows = content
        .iter()
        .map(|row| {
            keys.iter()
                .map(|k| {
                    row.get(k)
                        .unwrap_or_else(|| panic!("Failed to get key {} from {}", k, row))
                        .to_string()
                })
                .collect::<Vec<String>>()
                .join(",")
        })
        .collect::<Vec<String>>()
        .join("\n");

    Ok(utils::fs::write_file(
        &PathBuf::from(destination),
        &format!("{}{}", csv, rows),
    )?)
}

#[command]
pub async fn invalidate_query(path: &str) -> CommandResult<()> {
    utils::fs::remove_dir(path)?;
    Ok(())
}
