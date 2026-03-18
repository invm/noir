use anyhow::Result;
use serde_json::{json, Value};

use crate::database::QueryType;

use super::types::result::ResultSet;
use super::types::{config::ConnectionPool::*, connection::InitiatedConnection};
use super::{clickhouse, mysql, postgresql, sqlite};

pub async fn get_table_structure(conn: &InitiatedConnection, table: String) -> Result<Value> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_table_structure(conn, pool, table).await,
        Postgresql(pool) => postgresql::tables::get_table_structure(conn, pool, table).await,
        Sqlite(pool) => sqlite::tables::get_table_structure(pool, table).await,
        ClickHouse(client) => clickhouse::tables::get_table_structure(conn, client, table).await,
    }
}

pub async fn get_indices(conn: &InitiatedConnection, table: &str) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_indices(conn, pool, table).await,
        Postgresql(pool) => postgresql::tables::get_indices(conn, pool, table).await,
        Sqlite(pool) => sqlite::tables::get_indices(pool, table).await,
        ClickHouse(client) => clickhouse::tables::get_indices(conn, client, table).await,
    }
}

pub async fn get_columns(conn: &InitiatedConnection, table: Option<&str>) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_columns(conn, pool, table).await,
        Postgresql(pool) => postgresql::tables::get_columns(conn, pool, table).await,
        Sqlite(pool) => sqlite::tables::get_columns(pool, table).await,
        ClickHouse(client) => clickhouse::tables::get_columns(conn, client, table).await,
    }
}

pub async fn get_primary_key(conn: &InitiatedConnection, table: &str) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_primary_key(conn, pool, table).await,
        Postgresql(pool) => postgresql::tables::get_primary_key(conn, pool, table).await,
        Sqlite(pool) => sqlite::tables::get_primary_key(pool, table).await,
        ClickHouse(client) => clickhouse::tables::get_primary_key(conn, client, table).await,
    }
}

pub async fn get_foreign_keys(conn: &InitiatedConnection, table: &str) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_foreign_keys(conn, pool, table).await,
        Postgresql(pool) => postgresql::tables::get_foreign_keys(conn, pool, table).await,
        Sqlite(pool) => sqlite::tables::get_foreign_keys(pool, table).await,
        ClickHouse(client) => clickhouse::tables::get_foreign_keys(conn, client, table).await,
    }
}

pub async fn get_functions(conn: &InitiatedConnection) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_functions(conn, pool).await,
        Postgresql(pool) => postgresql::tables::get_functions(conn, pool).await,
        Sqlite(_pool) => Ok(vec![]),
        ClickHouse(client) => clickhouse::tables::get_functions(conn, client).await,
    }
}

pub async fn get_procedures(conn: &InitiatedConnection) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_procedures(conn, pool).await,
        Postgresql(pool) => postgresql::tables::get_procedures(conn, pool).await,
        Sqlite(_pool) => Ok(vec![]),
        ClickHouse(client) => clickhouse::tables::get_procedures(conn, client).await,
    }
}

pub async fn get_triggers(conn: &InitiatedConnection) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_triggers(conn, pool, None).await,
        Postgresql(pool) => postgresql::tables::get_triggers(conn, pool, None).await,
        Sqlite(pool) => sqlite::tables::get_triggers(pool, None).await,
        ClickHouse(client) => clickhouse::tables::get_triggers(conn, client, None).await,
    }
}

pub async fn get_schemas(conn: &InitiatedConnection) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_schemas(pool).await,
        Postgresql(pool) => postgresql::tables::get_schemas(pool).await,
        Sqlite(_pool) => Ok(vec![json!({
        "schema": conn.config.credentials.get("path").expect("Failed to get path from credentials").clone(),
        })]),
        ClickHouse(client) => clickhouse::tables::get_schemas(client).await,
    }
}

pub async fn get_views(conn: &InitiatedConnection) -> Result<Vec<Value>> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::tables::get_views(conn, pool).await,
        Postgresql(pool) => postgresql::tables::get_views(conn, pool).await,
        Sqlite(pool) => sqlite::tables::get_views(pool).await,
        ClickHouse(client) => clickhouse::tables::get_views(conn, client).await,
    }
}

pub async fn execute_query(conn: &InitiatedConnection, q: &str, t: QueryType) -> Result<ResultSet> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::query::execute_query(pool, q, t).await,
        Postgresql(pool) => postgresql::query::execute_query(pool, q, t).await,
        Sqlite(pool) => sqlite::query::execute_query(pool, q, t).await,
        ClickHouse(client) => clickhouse::query::execute_query(client, q, t).await,
    }
}

pub async fn execute_tx(conn: &InitiatedConnection, queries: Vec<&str>) -> Result<()> {
    match &conn.pool {
        Mysql(pool) | MariaDB(pool) => mysql::query::execute_tx(pool, queries).await,
        Postgresql(pool) => postgresql::query::execute_tx(pool, queries).await,
        Sqlite(pool) => sqlite::query::execute_tx(pool, queries).await,
        ClickHouse(client) => clickhouse::query::execute_tx(client, queries).await,
    }
}
