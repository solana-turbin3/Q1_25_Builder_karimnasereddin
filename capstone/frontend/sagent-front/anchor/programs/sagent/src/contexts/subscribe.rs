use anchor_lang::prelude::*;
use crate::states::*;
use anchor_lang::system_program;
use crate::errors::CustomError;
#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", initializer.key().as_ref()],
        bump = user.bump,
    )]
    pub user: Account<'info, Profile>,
    
    #[account(
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump,
    )]
    /// CHECK: This is the program's treasury account
    pub treasury: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> Subscribe<'info> {
    pub fn subscribe(&mut self) -> Result<()> {
        require_eq!(self.config.is_halted, false, CustomError::Halted);
        // Transfer SOL from initializer to treasury
        let transfer_instruction_accounts = system_program::Transfer {
            from: self.initializer.to_account_info(),
            to: self.treasury.to_account_info(),
        };
        
        system_program::transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                transfer_instruction_accounts
            ),
            self.config.subscription_price
        )?;

        // Update user's subscription status
        self.user.subscription = true;
        self.user.remaining_tx = self.config.subscription_allowance;
        
        Ok(())
    }
}