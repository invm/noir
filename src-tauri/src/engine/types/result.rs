use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TableMetadata {
    pub table: String,
    pub primary_key: Option<Vec<Value>>,
    pub foreign_keys: Option<Vec<Value>>,
    pub columns: Option<Vec<Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultSet {
    pub start_time: u64,
    pub end_time: u64,
    pub affected_rows: u64,
    pub rows: Vec<Value>,
    pub table: TableMetadata,
}
