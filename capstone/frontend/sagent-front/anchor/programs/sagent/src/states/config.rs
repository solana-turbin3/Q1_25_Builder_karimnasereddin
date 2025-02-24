use anchor_lang::prelude::*;

#[account]
pub struct Config {
    // Authority over the program params
    pub admin: Pubkey,          

    /// Fee charged per transaction if unsubscribed (bps)
    pub fee_basis_points: u16, // e.g., 100 = 1%
    
    /// Price of subscription (in lamports)
    pub subscription_price: u64, // e.g., 1_000_000_000 = 1 SOL
    
    /// Transactions granted per subscription
    pub subscription_allowance: u64, // e.g., 100
    
    /// Additional params
    pub treasury: Pubkey, // Treasury address
    pub is_halted: bool,  // Emergency stop
    pub config_bump: u8,
    pub treasury_bump: u8,  // Add this field
}

impl Space for Config {
    const INIT_SPACE: usize =       
    32    // admin : Pubkey
    + 2   // fee_basis_points: u16
    + 8    // subscription_price: u16 
    + 8    // subscription_allowance: u64 
    + 32    // treasury : Pubkey
    + 1     // is_halted: bool
    + 1     // bump: u8
    + 1     // treasury_bump: u8
    ;
}