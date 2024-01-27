use anyhow::Result;
use tracing::debug;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    debug!("app main:");
    Ok(())
}
