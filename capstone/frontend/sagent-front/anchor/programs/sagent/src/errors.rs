use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Program is halted")]
    ProgramHalted,
    #[msg("Integer overflow occurred")]
    Overflow,
}

