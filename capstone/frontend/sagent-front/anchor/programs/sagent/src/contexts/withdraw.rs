use anchor_lang::prelude::*;
use crate::states::Config;
use crate::errors::CustomError;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump,
    )]
    /// CHECK: Treasury account validated by seeds
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Recipient account
    pub recipient: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn execute_withdraw(&self, amount: u64) -> Result<()> {
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: self.treasury.to_account_info(),
            to: self.recipient.to_account_info(),
        };
        
        let signer_seeds = &[
            &b"treasury"[..],
            &[self.config.treasury_bump]
        ];
        
        anchor_lang::system_program::transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                transfer_instruction
            ).with_signer(&[signer_seeds]),
            amount
        )
    }
} 