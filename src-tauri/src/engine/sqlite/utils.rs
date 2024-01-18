use rusqlite::{types::ValueRef, Row};
use serde::Serialize;

use serde_json::json;

fn convert_value(value: ValueRef) -> serde_json::Value {
    match value.data_type() {
        rusqlite::types::Type::Real => json!(value.as_f64_or_null().unwrap()),
        rusqlite::types::Type::Integer => json!(value.as_i64_or_null().unwrap()),
        rusqlite::types::Type::Text => json!(value.as_str_or_null().unwrap().to_owned()),
        rusqlite::types::Type::Blob => json!(value.as_blob_or_null().unwrap()),
        _ => serde_json::Value::Null,
    }
}

pub fn row_to_object(row: &Row, column_count: usize) -> serde_json::Value {
    let mut object = json!({});
    for idx in 0..column_count {
        let name = row.as_ref().column_name(idx).unwrap().to_string();
        let value = row.get_ref_unwrap(idx);
        let value = convert_value(value);
        object[name] = value;
    }

    return object;
}

#[derive(Serialize)]
struct ColumnInfo {
    table_name: String,
    column_name: String,
    is_nullable: bool,
    data_type: String,
    character_maximum_length: Option<usize>,
}
