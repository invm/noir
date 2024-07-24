use anyhow::Result;
use serde_json::Value;

use super::config::{ConnectionConfig, ConnectionPool};
use super::result::{ResultSet, TableMetadata};
use crate::database::QueryType;
use crate::engine::exec;

#[derive(Debug, Clone)]
pub struct InitiatedConnection {
    pub config: ConnectionConfig,
    pub pool: ConnectionPool,
    pub schema: String,
}

impl InitiatedConnection {
    pub fn get_schema(&self) -> String {
        self.schema.clone()
    }

    pub fn set_schema(mut self, schema: String) -> Self {
        self.schema = schema.clone();
        match self.config.dialect {
            super::config::Dialect::Mysql | super::config::Dialect::MariaDB => {
                self.config.credentials.insert("db_name".to_string(), schema);
            }
            super::config::Dialect::Postgresql => {
                self.config.credentials.insert("schema".to_string(), schema);
            }
            super::config::Dialect::Sqlite => {
                self.config.credentials.insert("path".to_string(), schema);
            }
        };
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

    pub async fn get_table_metadata(&self, table: &str) -> Result<TableMetadata> {
        let foreign_keys = self.get_foreign_keys(table).await?;
        let primary_key = self.get_primary_key(table).await?;
        let columns = self.get_columns(Some(table)).await?;
        Ok(TableMetadata {
            table: table.to_string(),
            foreign_keys: Some(foreign_keys),
            primary_key: Some(primary_key),
            columns: Some(columns),
        })
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

    pub async fn execute_query(&self, q: &str, t: QueryType) -> Result<ResultSet> {
        exec::execute_query(self, q, t).await
    }

    pub async fn execute_tx(&self, queries: Vec<&str>) -> Result<()> {
        exec::execute_tx(self, queries).await
    }
}
