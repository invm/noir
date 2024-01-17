use anyhow::Result;
use deadpool_sqlite::Pool;
use futures::try_join;
use serde_json::{json, Value};

use super::query::raw_query;

pub async fn get_table_structure(pool: &Pool, table: String) -> Result<Value> {
    let (columns, constraints, triggers, indices) = try_join!(
        get_columns(pool, Some(&table)),
        get_constraints(pool, &table),
        get_triggers(pool, Some(&table)),
        get_indices(pool, &table),
    )?;

    let result = json!({
        "table": table,
        "columns": columns,
        "constraints": constraints,
        "indices": indices,
        "triggers": triggers,
    });

    Ok(result)
}

pub async fn get_columns(pool: &Pool, table: Option<&str>) -> Result<Vec<Value>> {
    let mut columns: Vec<Value> = vec![];
    let query = "SELECT tbl_name FROM sqlite_master WHERE type IN ('table', 'view') AND tbl_name NOT LIKE '%sqlite%'";
    let query = match table {
        Some(table) => format!("{} AND tbl_name = '{}';", query, table),
        None => format!("{};", query),
    };
    let tables = raw_query(pool, &query).await?;
    for table in tables {
        let table = table["tbl_name"].as_str().unwrap();
        let mut table_columns = get_table_columns(pool, table).await?;
        columns.append(&mut table_columns);
    }
    Ok(columns)
}

async fn get_table_columns(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let query = format!("PRAGMA table_info('{}');", table);
    let mut columns = raw_query(pool, &query).await?;
    columns.iter_mut().for_each(|column| {
        let column = column.as_object_mut().unwrap();
        column.insert("table_name".to_string(), table.to_string().into());
        column.insert("column_type".to_string(), column["type"].clone());
        column.remove("type");
        column.insert("column_name".to_string(), column["name"].clone());
        column.remove("name");
    });
    Ok(columns)
}

pub async fn get_constraints(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let columns = get_table_columns(pool, table).await?;
    let pk = columns
        .iter()
        .filter(|c| c["pk"].as_bool().unwrap())
        .map(|c| c.clone())
        .collect::<Vec<_>>();
    Ok(pk)
}

pub async fn get_indices(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let query = "SELECT * FROM sqlite_master WHERE type = 'index'";
    let query = format!("{} and tablename = '{}';", query, table);
    Ok(raw_query(pool, &query).await?)
}

pub async fn get_triggers(pool: &Pool, table: Option<&str>) -> Result<Vec<Value>> {
    let query = format!("SELECT * FROM sqlite_master WHERE type='trigger'");
    let query = match table {
        Some(table) => format!("{} AND tbl_name = '{}';", query, table),
        None => format!("{};", query),
    };
    Ok(raw_query(pool, &query).await?)
}

pub async fn get_views(pool: &Pool) -> Result<Vec<Value>> {
    let query = format!("SELECT * FROM sqlite_master WHERE type='view'");
    Ok(raw_query(pool, &query).await?)
}
