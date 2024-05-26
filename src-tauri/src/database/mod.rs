use std::fmt::{self, Display, Formatter};

use serde::{Deserialize, Serialize};

pub mod init;
pub mod queries;

#[derive(Clone, Copy, PartialEq, Serialize, Deserialize, Debug)]
pub enum QueryType {
    Select,
    Other,
}

impl Display for QueryType {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            QueryType::Select => write!(f, "Select"),
            QueryType::Other => write!(f, "Other"),
        }
    }
}
