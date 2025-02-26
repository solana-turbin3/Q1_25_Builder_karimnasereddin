use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Program is halted")]
    Halted,
    #[msg("Integer overflow occurred")]
    Overflow,
}

