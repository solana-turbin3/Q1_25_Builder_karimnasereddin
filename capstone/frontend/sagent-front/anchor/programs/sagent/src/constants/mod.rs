use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

pub const FUNDING_AMOUNT: u64 = LAMPORTS_PER_SOL;
pub const WSOL_ID: Pubkey = pubkey!("So11111111111111111111111111111111111111112");
pub const DEFAULT_SUPPLY: u64 = 1_000_000_000_000_000;
pub const DEFAULT_DECIMALS :u8 = 6;
pub const LOCK_CPMM_AUTHORITY: Pubkey = pubkey!("7AFUeLVRjBfzqK3tTGw8hN48KLQWSk6DTE8xprWdPqix");