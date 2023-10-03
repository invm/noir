use tauri::Manager;
use tokio::sync::mpsc;
use tokio::sync::Mutex;
use tracing::info;

pub struct AsyncProcInputTx {
    pub inner: Mutex<mpsc::Sender<String>>,
}

pub struct Query {
    pub query: String,
    pub id: String,
}

pub struct QueryResult {
    pub success: bool,
    pub id: String,
}

pub async fn async_process_model(
    mut input_rx: mpsc::Receiver<String>,
    output_tx: mpsc::Sender<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let output = input;
        output_tx.send(output).await?;
    }

    Ok(())
}

pub async fn enqueue_query(
    query: String,
    state: tauri::State<'_, AsyncProcInputTx>,
) -> Result<(), String> {
    info!(?query, "enqueue_query");
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(query)
        .await
        .map_err(|e| e.to_string())
}

pub async fn rs2js<R: tauri::Runtime>(message: String, manager: &impl Manager<R>) {
    info!(?message, "rs2js");
    manager
        .emit_all("rs2js", format!("rs: {}", message))
        .unwrap();
}
