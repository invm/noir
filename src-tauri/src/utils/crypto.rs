use anyhow::Result;
use rand::{distributions::Alphanumeric, Rng};
use simplecrypt::{decrypt, encrypt};
use std::fs;

use super::fs::get_app_path;

pub fn encrypt_data(data: &str, key: &str) -> Vec<u8> {
    return encrypt(data.as_bytes(), key.as_bytes());
}

pub fn decrypt_data(data: &Vec<u8>, key: &str) -> Result<Vec<u8>> {
    let decrypted = decrypt(data, key.as_bytes())?;
    return Ok(decrypted);
}

fn random_key_generator() -> String {
    return rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .into_iter()
        .collect();
}

pub fn create_app_key() -> Result<()> {
    let key_path = format!("{}/.key", get_app_path());
    Ok(fs::write(key_path, random_key_generator())?)
}

pub fn get_app_key() -> Result<String> {
    let key_path = format!("{}/.key", get_app_path());
    let key = fs::read(key_path)?;
    let key = String::from_utf8_lossy(&key).to_string();
    return Ok(key);
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
        assert_eq!(data, String::from_utf8_lossy(&decrypted));
        Ok(())
    }
}
