use anyhow::Result;
use mysql::prelude::Queryable;
use mysql::{Pool, Row, Value};
use rusqlite::{named_params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fmt::Display;
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum BaseConnectionMode {
    Host(HostCredentials),
    Socket(SocketCredentials),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum FileConnectionMode {
    File(PathBuf),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum Scheme {
    Mysql(BaseConnectionMode),
    Postgres(BaseConnectionMode),
    Sqlite(FileConnectionMode),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct SocketCredentials {
    pub username: String,
    pub password: Option<String>,
    pub path: PathBuf,
    pub dbname: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct HostCredentials {
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u16,
    pub dbname: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct ConnectionConfig {
    pub id: Uuid,
    pub scheme: Scheme,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone)]
pub enum ConnectionPool {
    Mysql(Pool),
    // Postgres(),
    // Sqlite(),
}

#[derive(Debug, Clone)]
pub struct ConnectedConnection {
    pub config: ConnectionConfig,
    pub pool: ConnectionPool,
}

pub enum QueryResult {
    Mysql(Vec<mysql::Row>),
    // Postgres(Vec<PgRow>),
    // Sqlite(Vec<SqliteRow>),
}

impl Display for QueryResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        return format!("{}", self).fmt(f);
    }
}

impl TryFrom<&str> for Scheme {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> std::result::Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(anyhow::anyhow!("Scheme cannot be empty"));
        }
        let object: Scheme = serde_json::from_str(value)?;
        Ok(object)
    }
}

impl ConnectionConfig {
    pub fn new(name: &str, scheme: Scheme, color: &str) -> Result<Self> {
        if name.is_empty() {
            return Err(anyhow::anyhow!("Connection name cannot be empty"));
        }
        if color.is_empty() {
            return Err(anyhow::anyhow!("Color cannot be empty"));
        }
        if scheme == Scheme::Sqlite(FileConnectionMode::File(PathBuf::new())) {
            return Err(anyhow::anyhow!("Sqlite connection must have a path"));
        }
        let id = Uuid::new_v4();
        Ok(ConnectionConfig {
            id,
            scheme,
            name: name.to_string(),
            color: color.to_string(),
        })
    }

    pub fn get_db_name(&self) -> String {
        match &self.scheme {
            Scheme::Mysql(BaseConnectionMode::Host(host)) => host.dbname.clone(),
            Scheme::Mysql(BaseConnectionMode::Socket(socket)) => socket.dbname.clone(),
            Scheme::Postgres(BaseConnectionMode::Host(host)) => host.dbname.clone(),
            Scheme::Postgres(BaseConnectionMode::Socket(socket)) => socket.dbname.clone(),
            Scheme::Sqlite(FileConnectionMode::File(path)) => {
                path.file_stem().unwrap().to_str().unwrap().to_string()
            }
        }
    }

    pub fn to_dsn(&self) -> String {
        match &self.scheme {
            Scheme::Mysql(BaseConnectionMode::Host(host)) => format!(
                "mysql://{}:{}@{}:{}/{}",
                host.username,
                host.password.clone().unwrap_or_default(),
                host.host,
                host.port,
                host.dbname
            ),
            Scheme::Mysql(BaseConnectionMode::Socket(socket)) => format!(
                "mysql://{}:{}@{}",
                socket.username,
                socket.password.clone().unwrap_or_default(),
                socket.path.display()
            ),
            Scheme::Postgres(BaseConnectionMode::Host(host)) => format!(
                "postgres://{}:{}@{}:{}/{}",
                host.username,
                host.password.clone().unwrap_or_default(),
                host.host,
                host.port,
                host.dbname
            ),
            Scheme::Postgres(BaseConnectionMode::Socket(socket)) => format!(
                "postgres://{}:{}@{}",
                socket.username,
                socket.password.clone().unwrap_or_default(),
                socket.path.display()
            ),
            Scheme::Sqlite(FileConnectionMode::File(path)) => {
                format!("sqlite://{}", path.display())
            }
        }
    }
}

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

impl ConnectedConnection {
    pub async fn new(config: ConnectionConfig) -> Result<Self> {
        match &config.scheme {
            Scheme::Mysql(BaseConnectionMode::Host(_)) => {
                let url: &str = &config.to_dsn();
                let pool = mysql::Pool::new(url)?;
                return Ok(ConnectedConnection {
                    config,
                    pool: ConnectionPool::Mysql(pool),
                });
            }
            Scheme::Mysql(BaseConnectionMode::Socket(_)) => todo!(),
            Scheme::Postgres(_) => todo!(),
            Scheme::Sqlite(_) => todo!(),
        }
    }
    pub async fn get_tables(&self) -> Result<serde_json::Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
            let db_name = self.config.get_db_name();
            let mut conn = pool.get_conn()?;
            let query = format!(
                "select * from information_schema.columns where table_schema = '{}'",
                db_name
            );

            let rows: Vec<Row> = conn.query(&query)?;
            let mut result = Vec::new();
            for row in rows {
                let mut object = json!({});
                for column in row.columns_ref() {
                    let column_value = &row[column.name_str().as_ref()];
                    let value = convert_value(column_value);
                    object[column.name_str().as_ref()] = value;
                }
                result.push(object);
            }
            let result = json!({ "columns": result });
            Ok(result)
            }
            // Pool::Postgres(_pool) => todo!(),
            // Pool::Sqlite(_pool) => todo!(),
        }
    }
}

pub fn add_connection(db: &Connection, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "INSERT INTO connections (
            id,
            scheme,
            name,
            color
            ) VALUES (
                :id,
                :scheme,
                :name,
                :color
                )",
    )?;
    let scheme = serde_json::to_string(&conn.scheme)?;
    statement.execute(named_params! {
        ":id": conn.id,
        ":name": conn.name,
        ":scheme": scheme,
        ":color": conn.color,
    })?;

    Ok(())
}

pub fn delete_connection(db: &Connection, id: &Uuid) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": id})?;
    Ok(())
}

pub fn get_all_connections(db: &Connection) -> Result<Vec<ConnectionConfig>> {
    let mut statement = db.prepare("SELECT * FROM connections")?;
    let mut rows = statement.query([])?;
    let mut items = Vec::new();
    while let Some(row) = rows.next()? {
        let scheme: String = row.get("scheme")?;
        let scheme: Scheme = serde_json::from_str(&scheme)?;

        items.push(ConnectionConfig {
            id: row.get("id")?,
            name: row.get("name")?,
            color: row.get("color")?,
            scheme,
        });
    }

    Ok(items)
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::Scheme;
    use crate::database::connections::{
        BaseConnectionMode, ConnectionConfig, FileConnectionMode, HostCredentials,
        SocketCredentials,
    };
    use anyhow::Result;

    enum DBType {
        MysqlHost,
        MysqlSocket,
        PostgresHost,
        PostgresSocket,
        SqliteFile,
    }

    fn get_input(db_type: DBType) -> String {
        return match db_type {
            DBType::MysqlHost => String::from(
                r#"{
                    "Mysql": {
                        "Host": {
                            "username": "mysqlhost",
                            "password": "mysqlhostpassword",
                            "host": "localhost",
                            "port": 3306,
                            "dbname": "mysqlhost"
                        }
                    }
                }"#,
            ),
            DBType::MysqlSocket => String::from(
                r#"{
                    "Mysql": {
                        "Socket": {
                            "username": "mysqlsocket",
                            "password": "mysqlsocketpassword",
                            "dbname": "mysqlsocket",
                            "path": "/var/run/mysqld/mysqld.sock"
                        }
                    }
                }"#,
            ),
            DBType::PostgresHost => String::from(
                r#"{
                    "Postgres": {
                        "Host": {
                            "username": "postgreshost",
                            "password": "postgreshostpassword",
                            "dbname": "postgreshost",
                            "host": "localhost",
                            "port": 5432
                        }
                    }
                }"#,
            ),
            DBType::PostgresSocket => String::from(
                r#"{
                    "Postgres": {
                        "Socket": {
                            "username": "postgressocket",
                            "password": "postgressocketpassword",
                            "dbname": "postgressocket",
                            "path": "/var/run/postgresql.sock"
                        }
                    }
                }"#,
            ),
            DBType::SqliteFile => String::from(
                r#"{
                    "Sqlite": {
                        "File": "/tmp/sqlite.db"
                    }
                }"#,
            ),
        };
    }

    #[test]
    fn test_schema_try_from_mysql_host() -> Result<()> {
        let input = get_input(DBType::MysqlHost);
        let scheme = Scheme::try_from(input.as_str())?;
        let creds = HostCredentials {
            username: "mysqlhost".to_string(),
            password: Some("mysqlhostpassword".to_string()),
            host: "localhost".to_string(),
            port: 3306,
            dbname: "mysqlhost".to_string(),
        };
        let expected = Scheme::Mysql(BaseConnectionMode::Host(creds));
        assert_eq!(scheme, expected);
        return Ok(());
    }

    #[test]
    fn test_schema_try_from_mysql_socket() -> Result<()> {
        let input = get_input(DBType::MysqlSocket);
        let scheme = Scheme::try_from(input.as_str())?;
        let creds = SocketCredentials {
            username: "mysqlsocket".to_string(),
            password: Some("mysqlsocketpassword".to_string()),
            dbname: "mysqlsocket".to_string(),
            path: "/var/run/mysqld/mysqld.sock".into(),
        };
        let expected = Scheme::Mysql(BaseConnectionMode::Socket(creds));
        assert_eq!(scheme, expected);
        return Ok(());
    }

    #[test]
    fn test_schema_try_from_psql_host() -> Result<()> {
        let input = get_input(DBType::PostgresHost);
        let scheme = Scheme::try_from(input.as_str())?;
        let creds = HostCredentials {
            username: "postgreshost".to_string(),
            password: Some("postgreshostpassword".to_string()),
            dbname: "postgreshost".to_string(),
            host: "localhost".to_string(),
            port: 5432,
        };
        let expected = Scheme::Postgres(BaseConnectionMode::Host(creds));
        assert_eq!(scheme, expected);
        return Ok(());
    }

    #[test]
    fn test_schema_try_from_psql_socket() -> Result<()> {
        let input = get_input(DBType::PostgresSocket);
        let scheme = Scheme::try_from(input.as_str())?;
        let creds = SocketCredentials {
            username: "postgressocket".to_string(),
            password: Some("postgressocketpassword".to_string()),
            dbname: "postgressocket".to_string(),
            path: "/var/run/postgresql.sock".into(),
        };
        let expected = Scheme::Postgres(BaseConnectionMode::Socket(creds));
        assert_eq!(scheme, expected);
        return Ok(());
    }

    #[test]
    fn test_schema_try_from_sqlite_file() -> Result<()> {
        let input = get_input(DBType::SqliteFile);
        let scheme = Scheme::try_from(input.as_str())?;
        let path = PathBuf::from("/tmp/sqlite.db");
        let creds = FileConnectionMode::File(path);
        let expected = Scheme::Sqlite(creds);
        assert_eq!(scheme, expected);
        return Ok(());
    }

    #[test]
    fn test_sqlite_new_connection() -> Result<()> {
        let input = get_input(DBType::SqliteFile);
        let scheme = Scheme::try_from(input.as_str())?;
        let path = PathBuf::from("/tmp/sqlite.db");
        let creds = FileConnectionMode::File(path);
        let expected = Scheme::Sqlite(creds);
        assert_eq!(scheme, expected);
        let conn_name = "sqlite";
        let conn = ConnectionConfig::new(conn_name, scheme, "red")?;
        assert_eq!(conn.name, conn_name);
        assert_eq!(conn.color, "red");
        match conn.scheme {
            Scheme::Sqlite(_) => (),
            _ => panic!("Should not be anything else"),
        }
        return Ok(());
    }

    #[test]
    fn test_mysql_new_connection() -> Result<()> {
        let input = get_input(DBType::MysqlHost);
        let scheme = Scheme::try_from(input.as_str())?;
        let creds = HostCredentials {
            username: "mysqlhost".to_string(),
            password: Some("mysqlhostpassword".to_string()),
            host: "localhost".to_string(),
            port: 3306,
            dbname: "mysqlhost".to_string(),
        };
        let expected = Scheme::Mysql(BaseConnectionMode::Host(creds));
        assert_eq!(scheme, expected);
        let conn_name = "mysql";
        let conn = ConnectionConfig::new(conn_name, scheme, "sky")?;
        assert_eq!(conn.name, conn_name);
        assert_eq!(conn.color, "sky");
        match conn.scheme {
            Scheme::Mysql(conn_type) => match conn_type {
                BaseConnectionMode::Host(creds) => {
                    assert_eq!(creds.username, "mysqlhost");
                    assert_eq!(creds.password, Some("mysqlhostpassword".to_string()));
                    assert_eq!(creds.host, "localhost");
                    assert_eq!(creds.port, 3306);
                    assert_eq!(creds.dbname, "mysqlhost");
                }
                _ => panic!("Should not be anything else than host"),
            },
            _ => panic!("Should not be anything else than mysql"),
        }
        return Ok(());
    }

    #[test]
    fn test_postgres_new_connection() -> Result<()> {
        let input = get_input(DBType::PostgresSocket);
        let scheme = Scheme::try_from(input.as_str())?;
        let path = PathBuf::from("/var/run/postgresql.sock");
        let creds = SocketCredentials {
            username: "postgressocket".to_string(),
            password: Some("postgressocketpassword".to_string()),
            dbname: "postgressocket".to_string(),
            path,
        };
        let expected = Scheme::Postgres(BaseConnectionMode::Socket(creds));
        assert_eq!(scheme, expected);
        let conn_name = "psql";
        let conn = ConnectionConfig::new(conn_name, scheme, "yellow")?;
        assert_eq!(conn.name, conn_name);
        assert_eq!(conn.color, "yellow");
        match conn.scheme {
            Scheme::Postgres(conn_type) => match conn_type {
                BaseConnectionMode::Socket(creds) => {
                    assert_eq!(creds.username, "postgressocket");
                    assert_eq!(creds.password, Some("postgressocketpassword".to_string()));
                    assert_eq!(creds.dbname, "postgressocket");
                    assert_eq!(creds.path, PathBuf::from("/var/run/postgresql.sock"));
                }
                _ => panic!("Should not be anything else than socket"),
            },
            _ => panic!("Should not be anything else than psql"),
        }
        return Ok(());
    }
}
