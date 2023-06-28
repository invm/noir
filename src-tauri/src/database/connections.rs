use anyhow::Result;
use rusqlite::{named_params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum BaseConnectionMode {
    Host(HostCredentials),
    Socket(SocketCredentials),
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum FileConnectionMode {
    File(PathBuf),
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum Scheme {
    Mysql(BaseConnectionMode),
    Postgres(BaseConnectionMode),
    Sqlite(FileConnectionMode),
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SocketCredentials {
    pub username: String,
    pub password: Option<String>,
    pub path: PathBuf,
    pub dbname: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct HostCredentials {
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u16,
    pub dbname: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct ConnectionConfig {
    pub id: Uuid,
    pub scheme: Scheme,
    pub connection_name: String,
    pub color: String,
    pub default_db: String,
    pub save_password: bool,
    pub metadata: Option<String>,
}

impl TryFrom<&str> for Scheme {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> std::result::Result<Self, Self::Error> {
        if value.len() == 0 {
            return Err(anyhow::anyhow!("Scheme cannot be empty"));
        }
        let object: Scheme = serde_json::from_str(value)?;
        return Ok(object);
    }
}

impl ConnectionConfig {
    pub fn new(name: &str, scheme: Scheme, save_password: bool, color: &str) -> Result<Self> {
        if name.len() == 0 {
            return Err(anyhow::anyhow!("Connection name cannot be empty"));
        }
        if color.len() == 0 {
            return Err(anyhow::anyhow!("Color cannot be empty"));
        }
        if scheme == Scheme::Sqlite(FileConnectionMode::File(PathBuf::new())) {
            return Err(anyhow::anyhow!("Sqlite connection must have a path"));
        }
        let id = Uuid::new_v4();
        let default_db = match &scheme {
            Scheme::Mysql(mysql) => match mysql {
                BaseConnectionMode::Host(host) => host.dbname.clone(),
                BaseConnectionMode::Socket(socket) => socket.dbname.clone(),
            },
            Scheme::Postgres(postgres) => match postgres {
                BaseConnectionMode::Host(host) => host.dbname.clone(),
                BaseConnectionMode::Socket(socket) => socket.dbname.clone(),
            },
            Scheme::Sqlite(path) => match path {
                FileConnectionMode::File(path) => path.to_str().unwrap().to_string(),
            },
        };
        return Ok(ConnectionConfig {
            id,
            scheme,
            connection_name: name.to_string(),
            color: color.to_string(),
            default_db,
            save_password,
            metadata: None,
        });
    }
}

pub fn add_connection(db: &Connection, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "INSERT INTO connections (
            id,
            scheme,
            connection_name,
            color,
            default_db,
            save_password,
            metadata
            ) VALUES (
                :id,
                :connection_name,
                :scheme,
                :color,
                :default_db,
                :save_password,
                :metadata
                )",
    )?;
    let scheme = serde_json::to_string(&conn.scheme)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    statement.execute(named_params! {
        ":id": conn.id,
        ":connection_name": conn.connection_name,
        ":scheme": scheme,
        ":color": conn.color,
        ":default_db": conn.default_db,
        ":save_password": conn.save_password,
        ":metadata": metadata,
    })?;

    Ok(())
}

pub fn update_connection(db: &Connection, conn: &ConnectionConfig) -> Result<()> {
    let mut statement = db.prepare(
        "INSERT INTO connections (
            connection_name,
            color,
            credentials,
            default_db,
            save_password,
            metadata
            ) VALUES (
                :connection_name,
                :color,
                :credentials,
                :default_db,
                :save_password,
                :metadata
                ) where id = :id",
    )?;
    let scheme = serde_json::to_string(&conn.scheme)?;
    let metadata = serde_json::to_string(&conn.metadata)?;
    statement.execute(named_params! {
        ":connection_name": conn.connection_name,
        ":color": conn.color,
        ":scheme": scheme,
        ":default_db": conn.default_db,
        ":save_password": conn.save_password,
        ":metadata": metadata,
        ":id": conn.id,
    })?;

    Ok(())
}

pub fn delete_connection(db: &Connection, id: &Uuid) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": id})?;
    Ok(())
}

pub fn get_all_connections(
    db: &Connection,
    limit: usize,
    offset: usize,
) -> Result<Vec<ConnectionConfig>> {
    let mut statement = db.prepare("SELECT * FROM connections LIMIT ? OFFSET ?")?;
    let mut rows = statement.query([limit, offset])?;
    let mut items = Vec::new();
    while let Some(row) = rows.next()? {
        let scheme: String = row.get("scheme")?;
        let scheme: Scheme = serde_json::from_str(&scheme)?;
        let metadata: String = row.get("metadata")?;
        let metadata: Option<String> = serde_json::from_str(&metadata).ok();

        items.push(ConnectionConfig {
            id: row.get("id")?,
            connection_name: row.get("name")?,
            color: row.get("color")?,
            scheme,
            default_db: row.get("default_db")?,
            save_password: row.get("save_password")?,
            metadata,
        });
    }

    Ok(vec![])
}

pub fn get_connection_by_id(db: &Connection, id: Uuid) -> Result<ConnectionConfig> {
    let mut statement = db.prepare("SELECT * FROM connections WHERE id = ?")?;
    let mut rows = statement.query([id])?;
    let row = rows.next()?;
    let row = row.ok_or(anyhow::anyhow!("No connection found"))?;
    let scheme: String = row.get("scheme")?;
    let scheme: Scheme = serde_json::from_str(&scheme)?;
    let metadata: String = row.get("metadata")?;
    let metadata: Option<String> = serde_json::from_str(&metadata).ok();

    return Ok(ConnectionConfig {
        id: row.get("id")?,
        connection_name: row.get("name")?,
        color: row.get("color")?,
        scheme,
        default_db: row.get("default_db")?,
        save_password: row.get("save_password")?,
        metadata,
    });
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
        let conn = ConnectionConfig::new(conn_name, scheme, false, "red")?;
        assert_eq!(conn.connection_name, conn_name);
        assert_eq!(conn.save_password, false);
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
        let conn = ConnectionConfig::new(conn_name, scheme, true, "sky")?;
        assert_eq!(conn.connection_name, conn_name);
        assert_eq!(conn.save_password, true);
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
        let conn = ConnectionConfig::new(conn_name, scheme, true, "yellow")?;
        assert_eq!(conn.connection_name, conn_name);
        assert_eq!(conn.save_password, true);
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