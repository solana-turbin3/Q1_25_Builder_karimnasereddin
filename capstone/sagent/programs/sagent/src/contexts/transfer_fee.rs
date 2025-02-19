use anchor_lang::prelude::*;
use crate::states::{Config, Profile};
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct TransferFee<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,
    
    #[account(
        seeds = [b"config"],
        bump=config.config_bump,
    )]
    pub config: Account<'info, Config>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump=config.treasury_bump,
    )]
    /// CHECK: Treasury account
    pub treasury: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> TransferFee<'info> {
    pub fn apply_fee(&self, amount: u64) -> Result<u64> {
        require!(!self.config.is_halted, CustomError::ProgramHalted);
        
        if !self.profile.subscription {
            let fee = amount
                .checked_mul(self.config.fee_basis_points.into())
                .and_then(|v| v.checked_div(10_000))
                .ok_or(CustomError::Overflow)?;
            
            let transfer_instruction = anchor_lang::system_program::Transfer {
                from: self.user.to_account_info(),
                to: self.treasury.to_account_info(),
            };
            
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    self.system_program.to_account_info(),
                    transfer_instruction
                ),
                fee
            )?;
            
            Ok(amount.checked_sub(fee).ok_or(CustomError::Overflow)?)
        } else {
            Ok(amount)
        }
    }
} 