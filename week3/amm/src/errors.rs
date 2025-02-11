use anchor_lang::error_code;


#[error_code]
pub enum AmmError {
    #[msg("Invalid Config")]
    InvalidConfig,
    #[msg("Invalid Amount")]
    InvalidAmount,
    #[msg("AMM is Locked")]
    AMMLocked,
    #[msg("Insufficient amount of token X")]
    InsufficientTokenX,
    #[msg("Insufficient amount of token Y")]
    InsufficientTokenY,
}