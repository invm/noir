use anyhow::Result;
use serde_json::Value;

use super::config::{ConnectionConfig, ConnectionOpts, ConnectionPool};
use super::result::ResultSet;
use crate::engine::exec;
use crate::utils::error::Error;

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
        exec::get_table_structure(self, table).await
    }

    pub async fn get_indices(&self, table: &str) -> Result<Vec<Value>> {
        exec::get_indices(self, table).await
    }

    pub async fn get_columns(&self, table: Option<&str>) -> Result<Vec<Value>> {
        exec::get_columns(self, table).await
    }

    pub async fn get_foreign_keys(&self, table: &str) -> Result<Vec<Value>> {
        exec::get_foreign_keys(self, table).await
    }

    pub async fn get_primary_key(&self, table: &str) -> Result<Vec<Value>> {
        exec::get_primary_key(self, table).await
    }

    pub async fn get_functions(&self) -> Result<Vec<Value>> {
        exec::get_functions(self).await
    }

    pub async fn get_procedures(&self) -> Result<Vec<Value>> {
        exec::get_procedures(self).await
    }

    pub async fn get_triggers(&self) -> Result<Vec<Value>> {
        exec::get_triggers(self).await
    }

    pub async fn get_schemas(&self) -> Result<Vec<Value>> {
        exec::get_schemas(self).await
    }

    pub async fn get_views(&self) -> Result<Vec<Value>> {
        exec::get_views(self).await
    }

    pub async fn execute_query(&self, q: &str) -> Result<ResultSet> {
        exec::execute_query(self, q).await
    }

    pub async fn execute_tx(&self, queries: Vec<&str>) -> Result<(), Error> {
        exec::execute_tx(self, queries).await
    }
}
