use anyhow::Result;
use simplecrypt::{decrypt, encrypt};

pub fn encrypt_data(data: &str, key: &str) -> Vec<u8> {
    return encrypt(data.as_bytes(), key.as_bytes());
}

pub fn decrypt_data(data: &Vec<u8>, key: &str) -> Result<Vec<u8>> {
    let decrypted = decrypt(data, key.as_bytes())?;
    return Ok(decrypted);
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
