use anyhow::Result;
use serde_json::{json, Value};

use super::config::{ConnectionConfig, ConnectionOpts, ConnectionPool};
use super::result::ResultSet;
use crate::utils::error::Error;

use super::super::engine::{mysql, postgresql, sqlite};

#[derive(Debug, Clone)]
pub struct InitiatedConnection {
    pub config: ConnectionConfig,
    pub pool: ConnectionPool,
    pub opts: ConnectionOpts,
    pub schema: String,
}

impl InitiatedConnection {
    pub fn get_schema(&self) -> String {
        self.schema.clone()
    }

    pub fn set_schema(mut self, schema: String) -> Self {
        self.schema = schema;
        self
    }

    pub async fn get_table_structure(&self, table: String) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                mysql::tables::get_table_structure(self, pool, table).await
            }
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_table_structure(self, pool, table).await
            }

            ConnectionPool::Sqlite(pool) => sqlite::tables::get_table_structure(pool, table).await,
        }
    }

    pub async fn get_indices(&self, table: &str) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_indices(self, pool, table).await,
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_indices(self, pool, table).await
            }

            ConnectionPool::Sqlite(pool) => sqlite::tables::get_indices(pool, table).await,
        }
    }

    pub async fn get_columns(&self, table: Option<&str>) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_columns(self, pool, table).await,
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_columns(&self, pool, table).await
            }

            ConnectionPool::Sqlite(pool) => sqlite::tables::get_columns(pool, table).await,
        }
    }

    pub async fn get_constraints(&self, table: &str) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_constraints(self, pool, table).await,
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_constraints(self, pool, table).await
            }
            ConnectionPool::Sqlite(pool) => sqlite::tables::get_constraints(pool, table).await,
        }
    }

    pub async fn get_functions(&self) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_functions(self, pool).await,
            ConnectionPool::Postgresql(pool) => postgresql::tables::get_functions(self, pool).await,
            ConnectionPool::Sqlite(_pool) => Ok(vec![]),
        }
    }

    pub async fn get_procedures(&self) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_procedures(self, pool).await,
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_procedures(self, pool).await
            }
            ConnectionPool::Sqlite(_pool) => Ok(vec![]),
        }
    }

    pub async fn get_triggers(&self) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_triggers(self, pool, None).await,
            ConnectionPool::Postgresql(pool) => {
                postgresql::tables::get_triggers(self, pool, None).await
            }
            ConnectionPool::Sqlite(pool) => sqlite::tables::get_triggers(pool, None).await,
        }
    }

    pub async fn get_schemas(&self) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_schemas(pool).await,
            ConnectionPool::Postgresql(pool) => postgresql::tables::get_schemas(pool).await,
            ConnectionPool::Sqlite(_pool) => Ok(vec![json!({
            "schema": self.config.credentials.get("path").unwrap().clone(),
            })]),
        }
    }

    pub async fn get_views(&self) -> Result<Vec<Value>> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::tables::get_views(&self, pool).await,
            ConnectionPool::Postgresql(pool) => postgresql::tables::get_views(&self, pool).await,
            ConnectionPool::Sqlite(pool) => sqlite::tables::get_views(pool).await,
        }
    }

    pub async fn execute_query(&self, q: &str) -> Result<ResultSet> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::query::execute_query(pool, q),
            ConnectionPool::Postgresql(pool) => postgresql::query::execute_query(pool, q).await,
            ConnectionPool::Sqlite(pool) => sqlite::query::execute_query(pool, q).await,
        }
    }

    pub async fn execute_tx(&self, queries: Vec<&str>) -> Result<(), Error> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => mysql::query::execute_tx(pool, queries),
            ConnectionPool::Postgresql(pool) => postgresql::query::execute_tx(pool, queries).await,
            ConnectionPool::Sqlite(pool) => sqlite::query::execute_tx(pool, queries).await,
        }
    }
}
