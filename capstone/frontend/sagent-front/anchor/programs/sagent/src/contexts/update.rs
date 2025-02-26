use anchor_lang::prelude::*;
use crate::states::Config;
use anchor_lang::system_program::System;
use crate::errors::CustomError;


#[derive(Accounts)]
#[instruction(admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64,is_halted: bool)]
pub struct Update<'info> {
#[account(mut)]
pub admin: Signer<'info>,

#[account(
    mut,
    seeds = [b"config"],
    bump=config.config_bump,
    has_one = admin @ CustomError::Unauthorized
)]
pub config: Account<'info, Config>,
#[account(
    mut,
    seeds = [b"treasury"], 
    bump=config.treasury_bump,
)]
pub treasury: SystemAccount<'info>,

pub system_program: Program<'info, System>,

}



impl<'info> Update<'info> {
    pub fn update(&mut self, admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64,is_halted: bool) -> Result<()> {
      self.config.set_inner(Config {
        admin,
        fee_basis_points,
        subscription_price,
        subscription_allowance,
        treasury: self.treasury.key(),
        is_halted,
        config_bump: self.config.config_bump,
        treasury_bump: self.config.treasury_bump,
    });
      Ok(())
    }
  }