use std::fmt::{self, Display, Formatter};

use serde::{Deserialize, Serialize};

pub mod init;
pub mod queries;

#[derive(Clone, Copy, PartialEq, Serialize, Deserialize, Debug)]
pub enum QueryType {
    Alter,
    Create,
    Delete,
    Drop,
    Insert,
    Other,
    Select,
    Show,
    Truncate,
    Update,
}

impl Display for QueryType {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            QueryType::Alter => write!(f, "Alter"),
            QueryType::Create => write!(f, "Create"),
            QueryType::Delete => write!(f, "Delete"),
            QueryType::Drop => write!(f, "Drop"),
            QueryType::Insert => write!(f, "Insert"),
            QueryType::Other => write!(f, "Other"),
            QueryType::Select => write!(f, "Select"),
            QueryType::Show => write!(f, "Show"),
            QueryType::Truncate => write!(f, "Truncate"),
            QueryType::Update => write!(f, "Update"),
        }
    }
}
