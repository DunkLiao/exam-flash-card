use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Card {
    pub id: String,
    pub front: String,
    pub back: String,
    #[serde(rename = "deckId")]
    pub deck_id: String,
    pub ease: f64,
    pub interval: u32,
    pub repetitions: u32,
    #[serde(rename = "nextReview")]
    pub next_review: String,
    #[serde(rename = "lastReview")]
    pub last_review: String,
    #[serde(rename = "starRating", default)]
    pub star_rating: u32,
    #[serde(rename = "mistakeCount", default)]
    pub mistake_count: u32,
    #[serde(rename = "lastMistakeAt", default)]
    pub last_mistake_at: Option<String>,
    #[serde(rename = "isMistake", default)]
    pub is_mistake: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Deck {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppData {
    pub decks: Vec<Deck>,
    pub cards: Vec<Card>,
}

fn get_data_dir(app: &tauri::AppHandle) -> PathBuf {
    let path = app.path().app_data_dir().expect("failed to get app data dir");
    fs::create_dir_all(&path).ok();
    path
}

fn get_data_file(app: &tauri::AppHandle) -> PathBuf {
    get_data_dir(app).join("data.json")
}

fn get_images_dir(app: &tauri::AppHandle) -> PathBuf {
    let path = get_data_dir(app).join("images");
    fs::create_dir_all(&path).ok();
    path
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
        .collect::<String>()
}

fn is_supported_image(filename: &str) -> bool {
    let ext = filename
        .split('.')
        .last()
        .unwrap_or("")
        .to_lowercase();
    matches!(
        ext.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp" | "svg"
    )
}

#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_data_dir(&app);
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to convert path".to_string())
}

#[tauri::command]
fn load_data(app: tauri::AppHandle) -> Result<AppData, String> {
    let path = get_data_file(&app);
    if !path.exists() {
        return Ok(AppData {
            decks: vec![],
            cards: vec![],
        });
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse: {}", e))
}

#[tauri::command]
fn save_data(app: tauri::AppHandle, data: AppData) -> Result<(), String> {
    let path = get_data_file(&app);
    let json = serde_json::to_string_pretty(&data).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write: {}", e))
}

#[tauri::command]
fn save_image(app: tauri::AppHandle, data: Vec<u8>, filename: String) -> Result<String, String> {
    let dir = get_images_dir(&app);
    let safe_name = sanitize_filename(&filename);
    if safe_name.is_empty() || !is_supported_image(&safe_name) {
        return Err("Unsupported image filename".to_string());
    }
    let path = dir.join(&safe_name);
    fs::write(&path, &data).map_err(|e| format!("Failed to save image: {}", e))?;
    Ok(format!("images/{}", safe_name))
}

#[tauri::command]
fn import_image_file(app: tauri::AppHandle, path: String, filename: String) -> Result<String, String> {
    let safe_name = sanitize_filename(&filename);
    if safe_name.is_empty() || !is_supported_image(&safe_name) || !is_supported_image(&path) {
        return Err("Unsupported image file".to_string());
    }

    let bytes = fs::read(&path).map_err(|e| format!("Failed to read image: {}", e))?;
    save_image(app, bytes, safe_name)
}

#[tauri::command]
fn get_image_base64(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let dir = get_images_dir(&app);
    let safe_name = sanitize_filename(&filename);
    let path = dir.join(&safe_name);
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read image: {}", e))?;
    let ext = safe_name.split('.').last().unwrap_or("png").to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        _ => "image/png",
    };
    Ok(format!("data:{};base64,{}", mime, base64_encode(&bytes)))
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[tauri::command]
fn delete_unused_images(app: tauri::AppHandle, used_paths: Vec<String>) -> Result<(), String> {
    let dir = get_images_dir(&app);
    if !dir.exists() {
        return Ok(());
    }
    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read dir: {}", e))?;
    let used: std::collections::HashSet<String> = used_paths.into_iter().collect();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !used.contains(&name) {
            fs::remove_file(entry.path()).ok();
        }
    }
    Ok(())
}

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Flashcard Files", &["json", "csv"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file();

    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
async fn open_image_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"])
        .blocking_pick_file();

    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
async fn save_file_dialog(app: tauri::AppHandle, default_name: String) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .blocking_save_file();

    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
fn export_to_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write: {}", e))
}

#[tauri::command]
fn read_import_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            save_image,
            import_image_file,
            delete_unused_images,
            get_image_base64,
            get_app_data_dir,
            open_file_dialog,
            open_image_dialog,
            save_file_dialog,
            export_to_file,
            read_import_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
