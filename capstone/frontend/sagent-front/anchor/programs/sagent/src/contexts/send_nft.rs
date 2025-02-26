use anchor_lang::{prelude::*, system_program};
use anchor_spl::{token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked}, associated_token::AssociatedToken};
use crate::states::{Config, Profile};
use crate::errors::CustomError;
#[derive(Accounts)]
pub struct SendNFT<'info> {
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
    bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
    seeds = [b"treasury"],
    bump = config.treasury_bump,
    )]
    /// CHECK: Treasury account
    pub treasury: SystemAccount<'info>,
    #[account(mut)]
    /// CHECK: Recipient account
    pub recipient: AccountInfo<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,
    
    pub mint: InterfaceAccount<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info,AssociatedToken>,
    pub token_program: Interface<'info,TokenInterface>
}

impl<'info> SendNFT<'info> {
    pub fn send_nft(&mut self) -> Result<()> {
        require_eq!(self.config.is_halted, false, CustomError::Halted);
        if !self.profile.subscription {
            let fee = 100_000_000;
            
            system_program::transfer(
                CpiContext::new(
                    self.system_program.to_account_info(),
                    system_program::Transfer {
                        from: self.user.to_account_info(),
                        to: self.treasury.to_account_info(),
                    }
                ),
                fee
            )?;
        } else {
            // Directly modify the SendSol's profile account
            self.profile.remaining_tx = self.profile.remaining_tx.checked_sub(1).ok_or(CustomError::Overflow)?;
            if self.profile.remaining_tx == 0 {
                self.profile.subscription = false;
            }
        };

        // Transfer remaining amount to recipient
        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=TransferChecked{
            from:self.user_ata.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_ata.to_account_info(),
            authority: self.user.to_account_info(),

        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
        transfer_checked(cpi_ctx,1,self.mint.decimals)?;
        Ok(())
    }
}
