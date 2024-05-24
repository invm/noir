use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde_json::{self, json, Value};
use sqlx::mysql::MySqlRow;
use sqlx::Decode;
use sqlx::{Column, Row, TypeInfo, ValueRef};

pub fn row_to_json(row: MySqlRow) -> Value {
    json!(row
        .columns()
        .iter()
        .map(|column| {
            let value: Value = sql_to_json(&row, column);
            (column.name().to_string(), value)
        })
        .collect::<HashMap<_, _>>())
}

pub fn sql_to_json(row: &MySqlRow, col: &sqlx::mysql::MySqlColumn) -> Value {
    let raw_value_result = row.try_get_raw(col.ordinal());
    match raw_value_result {
        Ok(raw_value) if !raw_value.is_null() => {
            let mut raw_value = Some(raw_value);
            log::trace!("Decoding a value of type {:?}", col.type_info().name());
            let decoded = sql_nonnull_to_json(|| {
                raw_value
                    .take()
                    .unwrap_or_else(|| row.try_get_raw(col.ordinal()).unwrap())
            });
            log::trace!("Decoded value: {:?}", decoded);
            decoded
        }
        Ok(_null) => Value::Null,
        Err(e) => {
            log::warn!("Unable to extract value from row: {:?}", e);
            Value::Null
        }
    }
}

pub fn sql_nonnull_to_json<'r>(
    mut get_ref: impl FnMut() -> sqlx::mysql::MySqlValueRef<'r>,
) -> Value {
    let raw_value = get_ref();
    match raw_value.type_info().name() {
        "REAL" | "FLOAT" | "NUMERIC" | "DECIMAL" | "FLOAT4" | "FLOAT8" | "DOUBLE" => {
            <f64 as Decode<sqlx::MySql>>::decode(raw_value)
                .unwrap_or(f64::NAN)
                .into()
        }
        "INT8" | "BIGINT" | "INTEGER" => <i64 as Decode<sqlx::MySql>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "INT" | "INT4" => <i32 as Decode<sqlx::MySql>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "INT2" | "SMALLINT" => <i16 as Decode<sqlx::MySql>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "BOOL" | "BOOLEAN" => <bool as Decode<sqlx::MySql>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "DATE" => <chrono::NaiveDate as Decode<sqlx::MySql>>::decode(raw_value)
            .as_ref()
            .map_or_else(std::string::ToString::to_string, ToString::to_string)
            .into(),
        "TIME" => <chrono::NaiveTime as Decode<sqlx::MySql>>::decode(raw_value)
            .as_ref()
            .map_or_else(ToString::to_string, ToString::to_string)
            .into(),
        "DATETIME" | "DATETIME2" | "DATETIMEOFFSET" | "TIMESTAMP" | "TIMESTAMPTZ" => {
            let mut date_time = <DateTime<Utc> as Decode<sqlx::MySql>>::decode(get_ref());
            if date_time.is_err() {
                date_time = <chrono::NaiveDateTime as Decode<sqlx::MySql>>::decode(raw_value)
                    .map(|d| d.and_utc());
            }
            Value::String(
                date_time
                    .as_ref()
                    .map_or_else(ToString::to_string, DateTime::to_rfc3339),
            )
        }
        "JSON" | "JSON[]" | "JSONB" | "JSONB[]" => {
            <Value as Decode<sqlx::MySql>>::decode(raw_value).unwrap_or_default()
        }
        // Deserialize as a string by default
        _ => <String as Decode<sqlx::MySql>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
    }
}
