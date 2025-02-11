use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod contexts;

pub use contexts::*;

declare_id!("p7s65DUSdvJwVs5nBSwQYzyHhRgZj2NKP4Gd2gbTELy");


#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.init(seed, fee, authority, ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, claim_amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(claim_amount, max_x, max_y)?;
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        claim_amount: u64,
        min_x: u64,
        min_y: u64,
    ) -> Result<()> {
        ctx.accounts.withdraw(claim_amount, min_x, min_y)?;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, is_x: bool, amount_in: u64, min_amount_out: u64) -> Result<()> {
        ctx.accounts.swap(is_x, amount_in, min_amount_out)?;
        Ok(())
    }
}