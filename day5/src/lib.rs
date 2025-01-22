pub mod instructions;
pub mod state;
use anchor_lang::prelude::*;


pub use instructions::*;
declare_id!("5tmv6xg7z9tMUyTr3zRCiFTiT3xC3wJeeHM6VjTfLHyo");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>,seed:u64,receive_amount:u64,deposit_amount:u64) -> Result<()> {
        ctx.accounts.init_escrow_state(seed,receive_amount,&ctx.bumps)?;
        ctx.accounts.deposit(deposit_amount)?;
        Ok(())
    }
    pub fn take(ctx:Context<Take>,amount:u64)-> Result<()> {
        ctx.accounts.deposit(amount)?;
        ctx.accounts.withdraw(amount)?;
        ctx.accounts.close_vault()?;
        Ok(())
    }
    pub fn refund(ctx:Context<Refund>)-> Result<()> {
        ctx.accounts.withdraw_and_close()?;
        Ok(())
    }
}

