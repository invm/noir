use anyhow::Result;
use rusqlite::{named_params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub enum BaseConnectionMode {
    Host(HostCredentials),
    Socket(SocketCredentials),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FileConnectionMode {
    File(PathBuf),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Scheme {
    Mysql(BaseConnectionMode),
    Postgres(BaseConnectionMode),
    Sqlite(FileConnectionMode),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SocketCredentials {
    pub username: String,
    pub password: Option<String>,
    pub path: PathBuf,
    pub dbname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HostCredentials {
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u16,
    pub dbname: String,
    pub params: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DBConnection {
    pub id: u32,
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
        todo!()
    }
}

pub fn add_connection(conn: &DBConnection, db: &Connection) -> Result<()> {
    // let mut statement = db.prepare("INSERT INTO connections (connection_name, color, credentials, default_db, save_password, metadata) VALUES (:connection_name, :color, :credentials, :default_db, :save_password, :metadata)")?;
    // let credentials = serde_json::to_string(&conn.credentials)?;
    // let metadata = serde_json::to_string(&conn.metadata)?;
    // statement.execute(named_params! {
    //     ":connection_name": conn.connection_name,
    //     ":color": conn.color,
    //     ":credentials": credentials,
    //     ":default_db": conn.default_db,
    //     ":save_password": conn.save_password,
    //     ":metadata": metadata,
    // })?;

    Ok(())
}

pub fn update_connection(db: &Connection, conn: &DBConnection) -> Result<()> {
    // let mut statement = db.prepare("INSERT INTO connections (connection_name, color, credentials, default_db, save_password, metadata) VALUES (:connection_name, :color, :credentials, :default_db, :save_password, :metadata) where id = :id")?;
    // let credentials = serde_json::to_string(&conn.credentials)?;
    // let metadata = serde_json::to_string(&conn.metadata)?;
    // statement.execute(named_params! {
    //     ":connection_name": conn.connection_name,
    //     ":color": conn.color,
    //     ":credentials": credentials,
    //     ":default_db": conn.default_db,
    //     ":save_password": conn.save_password,
    //     ":metadata": metadata,
    //     ":id": conn.id,
    // })?;

    Ok(())
}

pub fn delete_connection(db: &Connection, conn: &DBConnection) -> Result<()> {
    let mut statement = db.prepare("DELETE FROM connections where id = :id")?;
    statement.execute(named_params! {":id": conn.id})?;

    Ok(())
}

pub fn get_all_connections(
    db: &Connection,
    limit: usize,
    offset: usize,
) -> Result<Vec<DBConnection>> {
    // let mut statement = db.prepare("SELECT * FROM connections LIMIT ? OFFSET ?")?;
    // let mut rows = statement.query([limit, offset])?;
    // let mut items = Vec::new();
    // while let Some(row) = rows.next()? {
    //     let credentials: String = row.get("credentials")?;
    //     let credentials: HostCredentials = serde_json::from_str(&credentials)?;
    //     let metadata: String = row.get("metadata")?;
    //     let metadata: Option<String> = serde_json::from_str(&metadata).ok();
    //
    //     items.push(DBConnection {
    //         id: row.get("id")?,
    //         connection_name: row.get("name")?,
    //         color: row.get("color")?,
    //         credentials,
    //         default_db: row.get("default_db")?,
    //         save_password: row.get("save_password")?,
    //         metadata,
    //     });
    // }

    Ok(vec![])
}

// pub fn get_connection_by_id(db: &Connection, id: u32) -> Result<DBConnection> {
// let mut statement = db.prepare("SELECT * FROM connections WHERE id = ?")?;
// let mut rows = statement.query([id])?;
// let row = rows.next()?;
// let row = row.ok_or(anyhow::anyhow!("No connection found"))?;
// let credentials: String = row.get("credentials")?;
// let credentials: HostCredentials = serde_json::from_str(&credentials)?;
// let metadata: String = row.get("metadata")?;
// let metadata: Option<String> = serde_json::from_str(&metadata).ok();
//
// return Ok(DBConnection {
//     id: row.get("id")?,
//     connection_name: row.get("name")?,
//     color: row.get("color")?,
//     credentials,
//     default_db: row.get("default_db")?,
//     save_password: row.get("save_password")?,
//     metadata,
// });
//     return Ok(())
// }

#[cfg(test)]
mod test {
    use anyhow::Result;

    use super::Scheme;

    fn get_input() -> String {
        return String::from(
            r#"
        {"key":"value"}
            "#,
        );
    }

    #[test]
    fn test_schem_try_from() -> Result<()> {
        let str = get_input();
        let scheme = Scheme::try_from(str.as_str())?;
        Ok(())
    }
}
