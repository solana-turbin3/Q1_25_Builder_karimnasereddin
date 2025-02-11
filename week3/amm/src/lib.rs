use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod contexts;

pub use contexts::*;

declare_id!("p7s65DUSdvJwVs5nBSwQYzyHhRgZj2NKP4Gd2gbTELy");


#[program]
pub mod amm_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, seed: u64,fee: u16, authority: Option<Pubkey>) -> Result<()> {
        ctx.accounts.init(seed, fee, authority, &ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
         ctx.accounts.deposit_token(is_x, amount)?;
        Ok(())
    }
}
