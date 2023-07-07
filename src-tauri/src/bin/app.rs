use anyhow::Result;
use query_noir::utils::init;

fn main() -> Result<()> {
    init::init_app()?;
    Ok(())
}
