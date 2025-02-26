use anchor_lang::prelude::*;
use crate::states::Config;
use anchor_lang::system_program::System;


#[derive(Accounts)]
#[instruction(admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64)]
pub struct Initialize<'info> {
#[account(mut)]
pub admin: Signer<'info>,

#[account(
    init,
    payer = admin,
    space= 8+Config::INIT_SPACE,
    seeds = [b"config"],
    bump,
)]
pub config: Account<'info, Config>,
#[account(
    mut,
    seeds = [b"treasury"], 
    bump,
)]
pub treasury: SystemAccount<'info>,

pub system_program: Program<'info, System>,

}



impl<'info> Initialize<'info> {
    pub fn init(&mut self, admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64,bumps: &InitializeBumps) -> Result<()> {
      self.config.set_inner(Config {
        admin,
        fee_basis_points,
        subscription_price,
        subscription_allowance,
        treasury: self.treasury.key(),
        is_halted: false,
        config_bump: bumps.config,
        treasury_bump: bumps.treasury,
    });
      Ok(())
    }
  }