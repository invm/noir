use anyhow::Result;
use deadpool_postgres::Pool;
use futures::try_join;
use serde_json::{json, Value};

use crate::engine::types::connection::InitiatedConnection;

use super::query::raw_query;

pub async fn get_table_structure(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: String,
) -> Result<Value> {
    let (columns, foreign_keys, triggers, indices, pk) = try_join!(
        get_columns(conn, pool, Some(&table)),
        get_foreign_keys(conn, pool, &table),
        get_triggers(conn, pool, Some(&table)),
        get_indices(conn, pool, &table),
        get_primary_key(conn, pool, &table),
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

pub async fn get_columns(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT 
        COLUMN_NAME, 
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
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH,
        CHARACTER_OCTET_LENGTH,
        TABLE_SCHEMA,
        ORDINAL_POSITION, 
        TABLE_NAME
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!(
            "{} AND TABLE_NAME = '{}' ORDER BY ORDINAL_POSITION;",
            query, table
        ),
        None => format!("{} ORDER BY ORDINAL_POSITION;", query),
    };
    raw_query(pool.clone(), &query).await
}

pub async fn get_primary_key(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
    "SELECT c.column_name, c.table_name, tc.constraint_name, c.table_schema, c.ordinal_position
        FROM information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
        JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
          AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
        WHERE constraint_type = 'PRIMARY KEY' and c.table_schema = '{}'",
        schema
    );
    let query = format!("{} AND c.table_name = '{}'", query, table);
    raw_query(pool.clone(), &query).await
}

pub async fn get_foreign_keys(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT
          tc.constraint_name,
          kcu.column_name as column_name,
          ccu.table_name AS referenced_table_name,
          ccu.column_name AS referenced_column_name,
          rc.update_rule as update_rule,
          rc.delete_rule as delete_rule
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
          JOIN information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name
          AND tc.table_schema = rc.constraint_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = '{}'",
        schema
    );
    let query = format!("{} AND tc.table_name = '{}'", query, table);
    raw_query(pool.clone(), &query).await
}

pub async fn get_functions(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_type = 'FUNCTION' AND routine_schema = '{}';",
        schema
    );
    raw_query(pool.clone(), &query).await
}

pub async fn get_procedures(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '{}';", schema);
    raw_query(pool.clone(), &query).await
}

pub async fn get_indices(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: &str,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = '{}'",
        schema
    );
    let query = format!("{} and tablename = '{}';", query, table);
    raw_query(pool.clone(), &query).await
}

pub async fn get_triggers(
    conn: &InitiatedConnection,
    pool: &Pool,
    table: Option<&str>,
) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT trigger_name, event_manipulation, action_timing,
            event_object_table, action_statement, action_condition, created
            FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = '{}'",
        schema
    );
    let query = match table {
        Some(table) => format!("{} AND EVENT_OBJECT_TABLE = '{}';", query, table),
        None => format!("{};", query),
    };
    raw_query(pool.clone(), &query).await
}

pub async fn get_schemas(pool: &Pool) -> Result<Vec<Value>> {
    let query = "SELECT schema_name schema FROM information_schema.schemata;".to_string();
    raw_query(pool.clone(), &query).await
}

pub async fn get_views(conn: &InitiatedConnection, pool: &Pool) -> Result<Vec<Value>> {
    let schema = conn.get_schema();
    let query = format!(
        "SELECT table_name FROM INFORMATION_SCHEMA.views WHERE table_schema = '{}'",
        schema
    );
    raw_query(pool.clone(), &query).await
}
