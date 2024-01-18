use serde::{Serialize, Deserialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct TableMetadata {
    pub table: String,
    pub constraints: Option<Vec<Value>>,
    pub columns: Option<Vec<Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultSet {
    pub affected_rows: u64,
    pub warnings: u16,
    pub info: String,
    pub rows: Vec<Value>,
    pub table: TableMetadata,
}
