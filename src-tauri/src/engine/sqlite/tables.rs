use anyhow::Result;
use deadpool_sqlite::Pool;
use futures::try_join;
use serde_json::{json, Value};
use tracing::info;

use super::query::raw_query;

pub async fn get_table_structure(pool: &Pool, table: String) -> Result<Value> {
    let (columns, foreign_keys, triggers, indices, pk) = try_join!(
        get_columns(pool, Some(&table)),
        get_foreign_keys(pool, &table),
        get_triggers(pool, Some(&table)),
        get_indices(pool, &table),
        get_primary_key(pool, &table),
    )?;

    let result = json!({
        "table": table,
        "columns": columns,
        "foreign_keys": foreign_keys,
        "indices": indices,
        "triggers": triggers,
        "primary_key": pk,
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
        let table = table["tbl_name"]
            .as_str()
            .expect("Failed to get table name");
        let mut table_columns = get_table_columns(pool, table).await?;
        columns.append(&mut table_columns);
    }
    Ok(columns)
}

async fn get_table_columns(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let query = format!("PRAGMA table_info('{}');", table);
    let columns = raw_query(pool, &query).await?;
    let mut res = vec![];
    columns.iter().for_each(|column| {
        let column = column.as_object().expect("Failed to get column info");
        info!("column: {:?}", column);
        res.push(json!({
            "column_name": column["name"],
            "column_type": column["type"],
            "is_nullable": column["notnull"] == json!(0),
            "column_default": column["dflt_value"],
            "table_name": table.to_string(),
            "primary_key": column["pk"],
        }));
    });
    Ok(res)
}

pub async fn get_primary_key(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let columns = get_table_columns(pool, table).await?;
    let pks = columns
        .iter()
        .filter(|c| c["primary_key"] == json!(1)).cloned()
        .collect::<Vec<_>>();
    Ok(pks)
}

pub async fn get_foreign_keys(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let query = format!("PRAGMA foreign_key_list('{}');", table);
    let fks = raw_query(pool, &query).await?;
    let fks = fks
        .iter()
        .map(|fk| {
            json!({
                "constraint_name": fk["id"],
                "constraint_type": "FOREIGN KEY",
                "table_name": table,
                "column_name": fk["from"],
                "referenced_table_name": fk["table"],
                "referenced_column_name": fk["to"],
            })
        })
        .collect::<Vec<_>>();
    Ok(fks)
}

pub async fn get_indices(pool: &Pool, table: &str) -> Result<Vec<Value>> {
    let query = "SELECT * FROM sqlite_master WHERE type = 'index'";
    let query = format!("{} and tbl_name = '{}';", query, table);
    raw_query(pool, &query).await
}

pub async fn get_triggers(pool: &Pool, table: Option<&str>) -> Result<Vec<Value>> {
    let query = "SELECT * FROM sqlite_master WHERE type='trigger'";
    let query = match table {
        Some(table) => format!("{} AND tbl_name = '{}';", query, table),
        None => format!("{};", query),
    };
    raw_query(pool, &query).await
}

pub async fn get_views(pool: &Pool) -> Result<Vec<Value>> {
    let query = "SELECT * FROM sqlite_master WHERE type='view'";
    raw_query(pool, query).await
}
