use mysql::{Row, Value};
use serde_json::json;

fn convert_value(value: &mysql::Value) -> serde_json::Value {
    match value {
        Value::Bytes(v) => serde_json::Value::String(String::from_utf8_lossy(v).to_string()),
        Value::Int(v) => serde_json::Value::Number((*v).into()),
        Value::UInt(v) => serde_json::Value::Number((*v).into()),
        Value::Float(v) => serde_json::Value::Number(
            serde_json::Number::from_f64(<f32 as std::convert::Into<f64>>::into(*v)).unwrap(),
        ),
        Value::Double(v) => serde_json::Value::Number(serde_json::Number::from_f64(*v).unwrap()),
        Value::Date(y, m, d, ..) => serde_json::Value::String(format!("{}-{}-{}", y, m, d)),
        Value::Time(neg, _d, h, m, s, z) => serde_json::Value::String(format!(
            "{}{}:{}:{}{}",
            if *neg { "-" } else { "" },
            h,
            m,
            s,
            z
        )),
        _ => serde_json::Value::Null,
    }
}

pub fn row_to_object(row: Row) -> serde_json::Value {
    let mut object = json!({});
    for column in row.columns_ref() {
        let column_value = &row[column.name_str().as_ref()];
        let value = convert_value(column_value);
        object[column.name_str().as_ref()] = value;
    }

    return object;
}
