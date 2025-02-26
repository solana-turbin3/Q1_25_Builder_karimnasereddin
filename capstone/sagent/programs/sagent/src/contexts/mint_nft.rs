use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, MintTo,mint_to}
};
use crate::{states::{Config, Profile}, errors::CustomError};

#[derive(Accounts)]
pub struct MintNFT<'info> {
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
    mut,
    seeds = [b"treasury"],
    bump = config.treasury_bump,
    )]
    /// CHECK: Treasury account
    pub treasury: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info,AssociatedToken>,
    pub token_program: Interface<'info,TokenInterface>
}

impl<'info> MintNFT<'info> {
    pub fn mint_nft(&mut self) -> Result<()> {
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
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.user_ata.to_account_info(),
            authority: self.user.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            cpi_accounts
        );
        
        mint_to(cpi_ctx, 1)?;
        Ok(())
    }
}