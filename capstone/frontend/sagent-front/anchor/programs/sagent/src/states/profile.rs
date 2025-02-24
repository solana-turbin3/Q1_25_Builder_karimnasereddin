use anchor_lang::prelude::*;

#[account]
pub struct Profile {
    pub name: String, 
    pub subscription: bool, 
    pub remaining_tx: u64,
    pub bump: u8, 
}

impl Space for Profile {
    const INIT_SPACE: usize = 
     4    // String prefix (name length)
    + 32   // Name (max 32 chars)
    + 1    // subscription: bool 
    + 8    // remaining_tx: u64 
    + 1;   // bump: u8;
}