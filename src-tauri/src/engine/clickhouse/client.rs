use anyhow::{anyhow, Result};
use serde_json::Value;

#[derive(Debug, Clone)]
pub struct ClickHouseClient {
    client: reqwest::Client,
    base_url: String,
    user: String,
    password: String,
    pub database: String,
}

impl ClickHouseClient {
    pub fn new(host: &str, port: u16, user: &str, password: &str, database: &str) -> Result<Self> {
        let client = reqwest::Client::builder().build()?;

        Ok(Self {
            client,
            base_url: format!("http://{}:{}", host, port),
            user: user.to_string(),
            password: password.to_string(),
            database: database.to_string(),
        })
    }

    pub async fn query(&self, sql: &str) -> Result<Value> {
        let resp = self
            .client
            .post(&self.base_url)
            .query(&[
                ("database", self.database.as_str()),
                ("default_format", "JSON"),
                ("user", self.user.as_str()),
                ("password", self.password.as_str()),
            ])
            .body(sql.to_string())
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;

        if !status.is_success() {
            return Err(anyhow!("ClickHouse error: {}", body.trim()));
        }

        if body.is_empty() {
            return Ok(serde_json::json!({
                "meta": [],
                "data": [],
                "rows": 0,
            }));
        }

        // DDL/DML statements return non-JSON text — treat as success with empty data
        Ok(serde_json::from_str(&body).unwrap_or_else(|_| {
            serde_json::json!({
                "meta": [],
                "data": [],
                "rows": 0,
            })
        }))
    }

    pub async fn ping(&self) -> Result<()> {
        self.query("SELECT 1").await?;
        Ok(())
    }
}
