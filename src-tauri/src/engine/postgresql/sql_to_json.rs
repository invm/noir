use serde_json::{json, Value};
use sqlx::postgres::PgRow;
use sqlx::{Column, Decode, Row, TypeInfo, ValueRef};

pub fn row_to_json(row: PgRow) -> Value {
    let mut object = json!({});
    for column in row.columns().iter() {
        let value: Value = sql_to_json(&row, column);
        let name = column.name().to_string();
        object[name] = value;
    }
    object
}

pub fn sql_to_json(row: &PgRow, col: &sqlx::postgres::PgColumn) -> Value {
    let raw_value_result = row.try_get_raw(col.ordinal());
    match raw_value_result {
        Ok(raw_value) if !raw_value.is_null() => {
            let mut raw_value = Some(raw_value);
            let decoded = sql_nonnull_to_json(col, || {
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
    col: &sqlx::postgres::PgColumn,
    mut get_ref: impl FnMut() -> sqlx::postgres::PgValueRef<'r>,
) -> Value {
    let raw_value = get_ref();
    match col.type_info().name() {
        "BOOL" => <bool as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "INT2" => <i16 as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "INT4" => <i32 as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "INT8" => <i64 as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "FLOAT4" => {
            let v = <f32 as Decode<sqlx::Postgres>>::decode(raw_value).unwrap_or(f32::NAN);
            serde_json::Number::from_f64(v as f64)
                .map(Value::Number)
                .unwrap_or(Value::Null)
        }
        "FLOAT8" => {
            let v = <f64 as Decode<sqlx::Postgres>>::decode(raw_value).unwrap_or(f64::NAN);
            serde_json::Number::from_f64(v)
                .map(Value::Number)
                .unwrap_or(Value::Null)
        }
        "NUMERIC" => <String as Decode<sqlx::Postgres>>::decode(raw_value)
            .ok()
            .and_then(|s| s.parse::<f64>().ok())
            .and_then(serde_json::Number::from_f64)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        "TEXT" | "VARCHAR" | "CHAR" | "NAME" | "UNKNOWN" | "BPCHAR" | "CITEXT" => {
            <String as Decode<sqlx::Postgres>>::decode(raw_value)
                .unwrap_or_default()
                .into()
        }
        "JSON" | "JSONB" => <Value as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or(Value::Null),
        "UUID" => <uuid::Uuid as Decode<sqlx::Postgres>>::decode(raw_value)
            .map(|u| Value::String(u.to_string()))
            .unwrap_or(Value::Null),
        "TIMESTAMP" | "TIMESTAMPTZ" | "DATE" | "TIME" => {
            <String as Decode<sqlx::Postgres>>::decode(raw_value)
                .unwrap_or_default()
                .into()
        }
        "INET" => <String as Decode<sqlx::Postgres>>::decode(raw_value)
            .unwrap_or_default()
            .into(),
        "OID" => {
            let v = <i32 as Decode<sqlx::Postgres>>::decode(raw_value).unwrap_or_default();
            Value::Number(serde_json::Number::from(v))
        }
        "BOOL[]" => decode_array::<bool>(get_ref, |v| Value::Bool(v)),
        "INT2[]" => decode_array::<i16>(get_ref, |v| v.into()),
        "INT4[]" => decode_array::<i32>(get_ref, |v| v.into()),
        "INT8[]" => decode_array::<i64>(get_ref, |v| v.into()),
        "FLOAT4[]" => decode_array::<f32>(get_ref, |v| {
            serde_json::Number::from_f64(v as f64)
                .map(Value::Number)
                .unwrap_or(Value::Null)
        }),
        "FLOAT8[]" => decode_array::<f64>(get_ref, |v| {
            serde_json::Number::from_f64(v)
                .map(Value::Number)
                .unwrap_or(Value::Null)
        }),
        "TEXT[]" | "VARCHAR[]" => decode_array::<String>(get_ref, |v| Value::String(v)),
        "UUID[]" => decode_array::<uuid::Uuid>(get_ref, |v| Value::String(v.to_string())),
        "JSON[]" | "JSONB[]" => decode_array::<Value>(get_ref, |v| v),
        // Default: try string decode, fallback to null
        _ => <String as Decode<sqlx::Postgres>>::decode(raw_value)
            .map(Value::String)
            .unwrap_or(Value::Null),
    }
}

fn decode_array<'r, T>(
    mut get_ref: impl FnMut() -> sqlx::postgres::PgValueRef<'r>,
    to_json: impl Fn(T) -> Value,
) -> Value
where
    T: for<'a> Decode<'a, sqlx::Postgres> + sqlx::Type<sqlx::Postgres>,
{
    let raw_value = get_ref();
    match <Vec<T> as Decode<sqlx::Postgres>>::decode(raw_value) {
        Ok(arr) => Value::Array(arr.into_iter().map(to_json).collect()),
        Err(_) => Value::Null,
    }
}
