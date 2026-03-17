use serde_json::{json, Value};
use sqlx::sqlite::SqliteRow;
use sqlx::{Column, Decode, Row, TypeInfo, ValueRef};

pub fn row_to_json(row: SqliteRow) -> Value {
    let mut object = json!({});
    for column in row.columns().iter() {
        let value: Value = sql_to_json(&row, column);
        let name = column.name().to_string();
        object[name] = value;
    }
    object
}

pub fn sql_to_json(row: &SqliteRow, col: &sqlx::sqlite::SqliteColumn) -> Value {
    let raw_value_result = row.try_get_raw(col.ordinal());
    match raw_value_result {
        Ok(raw_value) if !raw_value.is_null() => {
            let mut raw_value = Some(raw_value);
            let decoded = sql_nonnull_to_json(|| {
                raw_value
                    .take()
                    .unwrap_or_else(|| row.try_get_raw(col.ordinal()).unwrap())
            });
            decoded
        }
        Ok(_null) => Value::Null,
        Err(e) => {
            log::warn!("Unable to extract value from row: {:?}", e);
            Value::Null
        }
    }
}

fn sql_nonnull_to_json<'r>(
    mut get_ref: impl FnMut() -> sqlx::sqlite::SqliteValueRef<'r>,
) -> Value {
    let raw_value = get_ref();
    match raw_value.type_info().name() {
        "INTEGER" => <i64 as Decode<sqlx::Sqlite>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "REAL" => <f64 as Decode<sqlx::Sqlite>>::decode(raw_value)
            .unwrap_or(f64::NAN)
            .into(),
        "BLOB" => {
            let bytes = <Vec<u8> as Decode<sqlx::Sqlite>>::decode(raw_value)
                .unwrap_or_default();
            Value::Array(bytes.into_iter().map(|b| Value::Number(b.into())).collect())
        }
        // TEXT and everything else: decode as string
        _ => <String as Decode<sqlx::Sqlite>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
    }
}
