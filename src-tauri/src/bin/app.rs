use anyhow::Result;
use query_noir::utils::fs;

fn main() -> Result<()> {
    env_logger::init();
    fs::init_app()?;

    // let mut colors = conn.prepare("select id, name from cat_colors")?;
    //
    // println!("Displaying cat colors");
    // println!("id | name");
    // for color in colors.query_map([], |row| {
    //     Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
    // })? {
    //     let color = color?;
    //     println!("{}  | {}", color.0, color.1);
    // }

    Ok(())
}
