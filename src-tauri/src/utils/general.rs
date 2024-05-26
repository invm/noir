use anyhow::Result;
use tauri::{AppHandle, Manager, State};
use tokio::process::Command;
use tokio_util::sync::CancellationToken;

use crate::state::AppState;
use std::{collections::HashMap, net::TcpListener, time::Duration};

fn port_is_available(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

pub fn get_available_port() -> u16 {
    (5000..10000)
        .find(|port| port_is_available(*port))
        .expect("Could not find open port")
}

async fn port_forward(
    available_port: u16,
    host: String,
    port: String,
    ssh_cfg: HashMap<String, String>,
) -> Result<()> {
    let empty_str = String::default(); // ssh -P {SSH_PORT} -N -L {LOCAL_PORT}:{DB_SERVER_HOST}:{DB_PORT} {SSH_OS_USER}@{SSH_HOST_WHERE_DB_IS_RUNNING)}
                                       // ssh -p 20022 -N -L 3307:127.0.0.1:3306 some_user@example.com
    let ssh_port = ssh_cfg.get("ssh_port").unwrap_or(&empty_str);
    let ssh_host = ssh_cfg.get("ssh_host").unwrap_or(&empty_str);
    let ssh_user = ssh_cfg.get("ssh_user").unwrap_or(&empty_str);
    Command::new("ssh")
        .args([
            "-P",
            ssh_port,
            "-N",
            "-L",
            &format!("{}:{}:{}", available_port, host, port),
            &format!("{}@{}", ssh_user, ssh_host),
        ])
        .kill_on_drop(true)
        .status()
        .await
        .expect("ls command failed to run");
    Ok(())
}

pub async fn request_port_forward(
    handle: AppHandle,
    conn_id: String,
    available_port: u16,
    host: String,
    port: String,
    ssh_cfg: HashMap<String, String>,
) -> Result<()> {
    let token = CancellationToken::new();
    let state: State<'_, AppState> = handle.state();
    let cloned_token = token.clone();
    let mut binding = state.cancel_tokens.lock().await;
    binding.insert(conn_id.clone(), token);

    tokio::spawn(async move {
        tokio::select! {
            _ = cloned_token.cancelled() => {
            },
            _ = port_forward(available_port, host, port, ssh_cfg) => {
            }
        }
    });

    // add a delay to ensure the port forwarding is successful
    tokio::time::sleep(Duration::from_millis(500)).await;

    Ok(())
}
