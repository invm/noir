use anyhow::{anyhow, Result};
use postgres::{
    types::{FromSql, Type},
    Column, Row,
};
use serde_json::{json, Value};

pub fn row_to_object(row: Row) -> Result<Value> {
    let mut object = json!({});
    for (i, column) in row.columns().iter().enumerate() {
        let value = convert_value(&row, column, i)?;
        let name = column.name();
        object[name] = value;
    }
    Ok(object)
}

fn convert_value(row: &Row, column: &Column, column_i: usize) -> Result<Value> {
    let f64_to_json_number = |raw_val: f64| -> Result<Value> {
        let temp = serde_json::Number::from_f64(raw_val).ok_or(anyhow!("invalid json-float"))?;
        Ok(Value::Number(temp))
    };
    Ok(match *column.type_() {
        // for rust-postgres <> postgres type-mappings: https://docs.rs/postgres/latest/postgres/types/trait.FromSql.html#types
        // for postgres types: https://www.postgresql.org/docs/7.4/datatype.html#DATATYPE-TABLE
        Type::UUID => get_basic(row, column, column_i, |a: uuid::Uuid| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::UUID_ARRAY => get_basic(row, column, column_i, |a: uuid::Uuid| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::OID => get_basic(row, column, column_i, |a: u32| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::INET => get_basic(row, column, column_i, |a: std::net::IpAddr| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::TIMESTAMP => get_basic(row, column, column_i, |a: chrono::NaiveDateTime| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::TIMESTAMPTZ => {
            get_basic(row, column, column_i, |a: chrono::DateTime<chrono::Utc>| {
                Ok(Value::String(a.to_string()))
            })?
        }
        Type::BOOL => get_basic(row, column, column_i, |a: bool| Ok(Value::Bool(a)))?,
        Type::INT2 => get_basic(row, column, column_i, |a: i16| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::INT4 => get_basic(row, column, column_i, |a: i32| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::INT8 => get_basic(row, column, column_i, |a: i64| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::TEXT | Type::VARCHAR | Type::NAME | Type::CHAR | Type::UNKNOWN => {
            get_basic(row, column, column_i, |a: String| Ok(Value::String(a)))?
        }
        Type::JSON | Type::JSONB => get_basic(row, column, column_i, |a: Value| Ok(a))?,
        Type::FLOAT4 => get_basic(row, column, column_i, |a: f32| f64_to_json_number(a.into()))?,
        Type::FLOAT8 => get_basic(row, column, column_i, |a: f64| f64_to_json_number(a))?,
        Type::DATE => get_basic(row, column, column_i, |a: chrono::NaiveDate| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::TIME => get_basic(row, column, column_i, |a: chrono::NaiveTime| {
            Ok(Value::String(a.to_string()))
        })?,
        Type::BOOL_ARRAY => get_array(row, column, column_i, |a: bool| Ok(Value::Bool(a)))?,
        Type::INT2_ARRAY => get_array(row, column, column_i, |a: i16| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::INT4_ARRAY => get_array(row, column, column_i, |a: i32| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::INT8_ARRAY => get_array(row, column, column_i, |a: i64| {
            Ok(Value::Number(serde_json::Number::from(a)))
        })?,
        Type::TEXT_ARRAY | Type::VARCHAR_ARRAY => {
            get_array(row, column, column_i, |a: String| Ok(Value::String(a)))?
        }
        Type::JSON_ARRAY | Type::JSONB_ARRAY => get_array(row, column, column_i, |a: Value| Ok(a))?,
        Type::FLOAT4_ARRAY => {
            get_array(row, column, column_i, |a: f32| f64_to_json_number(a.into()))?
        }
        Type::FLOAT8_ARRAY => get_array(row, column, column_i, |a: f64| f64_to_json_number(a))?,

        _ => {
            let val: Option<GenericEnum> = row.get(1);
            if let Some(_i) = val {
                return Ok(Value::String(_i.0));
            }
            // try as string and not enum
            let val: Option<String> = row.get(column_i);
            if let Some(val) = val {
                return Ok(Value::String(val));
            }
            Value::Null
        }
    })
}
#[derive(Debug)]
struct GenericEnum(String);

impl FromSql<'_> for GenericEnum {
    fn from_sql(
        _: &Type,
        raw: &[u8],
    ) -> Result<GenericEnum, Box<dyn std::error::Error + Sync + Send>> {
        let result = std::str::from_utf8(raw).expect("Failed to convert to utf8 string");
        let val = GenericEnum(result.to_owned());
        Ok(val)
    }
    fn accepts(_ty: &Type) -> bool {
        true
    }
}

fn get_basic<'a, T: FromSql<'a>>(
    row: &'a Row,
    _column: &Column,
    column_i: usize,
    val_to_json_val: impl Fn(T) -> Result<Value>,
) -> Result<Value> {
    let raw_val = row.try_get::<_, Option<T>>(column_i)?;
    raw_val.map_or(Ok(Value::Null), val_to_json_val)
}
fn get_array<'a, T: FromSql<'a>>(
    row: &'a Row,
    _column: &Column,
    column_i: usize,
    val_to_json_val: impl Fn(T) -> Result<Value>,
) -> Result<Value> {
    let raw_val_array = row.try_get::<_, Option<Vec<T>>>(column_i)?;
    Ok(match raw_val_array {
        Some(val_array) => {
            let mut result = vec![];
            for val in val_array {
                result.push(val_to_json_val(val)?);
            }
            Value::Array(result)
        }
        None => Value::Null,
    })
}
