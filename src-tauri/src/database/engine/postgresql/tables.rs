use anyhow::Result;
use deadpool_postgres::Pool;
use futures::try_join;
use serde_json::{json, Value};

use crate::database::connections::InitiatedConnection;

use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: String,
) -> Result<Value> {
    let (columns, constraints, triggers, indices) = try_join!(
        get_columns(conn, pool, Some(&table)),
        get_constraints(conn, pool, Some(&table)),
        get_triggers(conn, pool, Some(&table)),
        get_indices(conn, pool, Some(&table)),
    )?;

    let result = json!({
        "table": table,
        "columns": columns["result"],
        "constraints": constraints["result"],
        "indices": indices["result"],
        "triggers": triggers["result"],
    });

    Ok(result)
}

pub async fn get_columns(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME, 
        ORDINAL_POSITION, 
        COLUMN_DEFAULT,
        IS_NULLABLE,
        DATA_TYPE, 
        CASE
            WHEN character_maximum_length is not null  and udt_name != 'text'
              THEN CONCAT(udt_name, concat('(', concat(character_maximum_length::varchar(255), ')')))
            WHEN numeric_precision is not null
                    THEN CONCAT(udt_name, concat('(', concat(numeric_precision::varchar(255),',',numeric_scale::varchar(255), ')')))
            WHEN datetime_precision is not null AND udt_name != 'date' THEN
              CONCAT(udt_name, concat('(', concat(datetime_precision::varchar(255), ')')))
            ELSE udt_name
        END as COLUMN_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        CHARACTER_OCTET_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}';", query, table),
        None => format!("{};", query),
    };
    let columns = raw_query(pool.clone(), &query).await?;
    Ok(columns)
}

pub async fn get_constraints(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT CONSTRAINT_NAME, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND TABLE_NAME = '{}'", query, table),
        None => format!("{};", query),
    };
    let fks = raw_query(pool.clone(), &query).await?;
    Ok(fks)
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_type = 'FUNCTION' AND routine_schema = '{}';",
        schema
    );
    let functions = raw_query(pool.clone(), &query).await?;
    Ok(functions)
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", schema);
    let procedures = raw_query(pool.clone(), &query).await?;
    Ok(procedures)
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM
                        information_schema.statistics WHERE non_unique = 1 AND table_schema = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} and TABLE_NAME = '{}';", query, table),
        None => format!("{};", query),
    };
    let indices = raw_query(pool.clone(), &query).await?;
    Ok(indices)
}

pub async fn get_triggers(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    let triggers = raw_query(pool.clone(), &query).await?;
    Ok(triggers)
}

pub async fn get_schemas(pool: &Pool) -> Result<Value> {
    let query = "SELECT schema_name schema FROM information_schema.schemata;".to_string();
    let schemas = raw_query(pool.clone(), &query).await?;
    Ok(schemas)
}

pub async fn get_views(conn: &InitiatedConnection, pool: &Pool) -> Result<Value> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT table_name FROM INFORMATION_SCHEMA.views WHERE table_schema = '{}'",
        schema
    );
    let views = raw_query(pool.clone(), &query).await?;
    Ok(views)
}
