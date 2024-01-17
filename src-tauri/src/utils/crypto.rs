use anyhow::Result;
use md5::{Digest, Md5};
use rand::{distributions::Alphanumeric, Rng};
use std::{fs, path::PathBuf};

use super::fs::get_app_path;

pub fn encrypt_data(data: &str, _key: &str) -> Vec<u8> {
    return data.as_bytes().to_vec();
}

pub fn decrypt_data(data: &Vec<u8>, _key: &str) -> Result<String> {
    let decrypted = data;
    Ok(String::from_utf8_lossy(decrypted).to_string())
}

fn random_key_generator() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect()
}

fn get_key_path() -> PathBuf {
    PathBuf::from(format!("{}/._", get_app_path().to_str().unwrap()))
}

pub fn create_app_key() -> Result<()> {
    let key_path = get_key_path();
    Ok(fs::write(key_path, random_key_generator())?)
}

pub fn get_app_key() -> Result<String> {
    let key_path = get_key_path();
    let key = fs::read(key_path)?;
    let key = String::from_utf8_lossy(&key).to_string();
    Ok(key)
}

pub fn md5_hash(data: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(data);
    let hash = hasher.finalize();
    format!("{:x}", hash)
}

#[cfg(test)]
mod test {
    use anyhow::Result;

    use crate::utils::crypto::{decrypt_data, encrypt_data};

    fn get_input() -> [std::string::String; 2] {
        let data = String::from("{\"asd\":\"bs\",\"key\":\"val\",\"num\":4}");
        let pass = "password".to_string();
        return [data, pass];
    }

    #[test]
    fn test_encrypt() -> Result<()> {
        let [data, pass] = get_input();
        let encrypted = encrypt_data(&data, &pass);
        assert_ne!(data, String::from_utf8_lossy(&encrypted));
        let decrypted = decrypt_data(&encrypted, &pass)?;
        assert_eq!(data, decrypted);
        Ok(())
    }
}
