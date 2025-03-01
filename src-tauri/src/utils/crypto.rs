use anyhow::Result;
use magic_crypt::{new_magic_crypt, MagicCrypt256, MagicCryptTrait};
use md5::{Digest, Md5};
use tauri::AppHandle;

use super::fs::read_key;

pub fn encrypt_data(data: &str, key: &MagicCrypt256) -> String {
    key.encrypt_str_to_base64(data)
}

pub fn decrypt_data(data: &str, key: &MagicCrypt256) -> Result<String> {
    key.decrypt_base64_to_string(data).map_err(|e| e.into())
}

pub fn get_app_key(app: AppHandle) -> Result<MagicCrypt256> {
    let key = read_key(app)?;
    let key = String::from_utf8_lossy(&key).to_string();
    Ok(new_magic_crypt!(key, 256))
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
    use magic_crypt::new_magic_crypt;

    #[test]
    fn test_encrypt() -> Result<()> {
        let data = String::from("{\"asd\":\"bs\",\"key\":\"val\",\"num\":4}");
        let pass = new_magic_crypt!("magickey", 256);
        let encrypted = encrypt_data(&data, &pass);
        assert_ne!(data, encrypted);
        let decrypted = decrypt_data(&encrypted, &pass)?;
        assert_eq!(data, decrypted);
        Ok(())
    }
}
