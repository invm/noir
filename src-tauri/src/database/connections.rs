use anyhow::Result;
use mysql::Pool;
use rusqlite::{named_params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use uuid::Uuid;

use super::engine;

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
pub enum Dialect {
    Mysql,
    Postgres,
    Sqlite,
}

impl Dialect {
    pub fn as_str(&self) -> &'static str {
        match self {
            Dialect::Mysql => "mysql",
            Dialect::Postgres => "postgres",
            Dialect::Sqlite => "sqlite",
        }
    }
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
    pub dialect: Dialect,
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
            dialect: match scheme {
                Scheme::Mysql(_) => Dialect::Mysql,
                Scheme::Postgres(_) => Dialect::Postgres,
                Scheme::Sqlite(_) => Dialect::Sqlite,
            },
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultSet {
    pub affected_rows: u64,
    pub warnings: u16,
    pub info: String,
    pub rows: Vec<serde_json::Value>,
}

impl ConnectedConnection {
    pub async fn new(config: ConnectionConfig) -> Result<Self> {
        match &config.scheme {
            Scheme::Mysql(BaseConnectionMode::Host(_)) => {
                let url: &str = &config.to_dsn();
                let pool = Pool::new(url)?;
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

    pub async fn get_table_structure(&self, table: String) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_table_structure(self, pool, table).await
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_indices(&self, table: Option<&str>) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_indices(self, pool, table).await
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_columns(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_columns(self, pool, None).await
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_constraints(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_constraints(self, pool, None).await
            }
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_functions(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_functions(self, pool).await,
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_procedures(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::tables::get_procedures(self, pool).await,
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn get_triggers(&self) -> Result<Value> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => {
                engine::mysql::tables::get_triggers(self, pool, None).await
            }
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }

    pub async fn execute_query(&self, q: &str) -> Result<ResultSet> {
        match &self.pool {
            ConnectionPool::Mysql(pool) => engine::mysql::query::execute_query(pool, q),
            // ConnectionPool::Postgres(_pool) => todo!(),
            // ConnectionPool::Sqlite(_pool) => todo!(),
        }
    }
}

pub fn add_connection(db: &Connection, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "INSERT INTO connections (
            id,
            scheme,
            dialect, 
            name,
            color
            ) VALUES (
                :id,
                :scheme,
                :dialect,
                :name,
                :color
                )",
    )?;
    let scheme = serde_json::to_string(&conn.scheme)?;
    statement.execute(named_params! {
        ":id": conn.id,
        ":name": conn.name,
        ":scheme": scheme,
        ":dialect": conn.dialect.as_str(),
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
            dialect: match scheme {
                Scheme::Mysql(_) => Dialect::Mysql,
                Scheme::Postgres(_) => Dialect::Postgres,
                Scheme::Sqlite(_) => Dialect::Sqlite,
            },
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
