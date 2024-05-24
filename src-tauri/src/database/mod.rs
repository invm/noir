use serde::{Deserialize, Serialize};

pub mod init;
pub mod queries;

#[derive(Clone, Copy, PartialEq, Serialize, Deserialize, Debug)]
pub enum QueryType {
    Select,
    Other,
}
