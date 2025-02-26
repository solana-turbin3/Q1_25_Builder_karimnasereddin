use anchor_lang::{prelude::*, system_program};

use anchor_spl::token_interface::{Mint, TokenInterface};
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    mpl_token_metadata::types::DataV2,
    CreateMetadataAccountsV3, 
    Metadata as Metaplex,
};
use crate::states::{Profile, Config};
use crate::errors::CustomError;
#[derive(Accounts)]
#[instruction(params: InitTokenParams)]
pub struct CreateMint<'info> {
    #[account(
    mut,
    seeds = [b"profile", signer.key().as_ref()],
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
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = params.decimals,
        mint::authority = signer.key(),
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    /// CHECK: metadata account is not validated
    pub metadata: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub token_metadata_program: Program<'info, Metaplex>,

}

impl<'info> CreateMint<'info> {
    pub fn create_mint(&mut self,metadata: InitTokenParams) -> Result<()> {
        require_eq!(self.config.is_halted, false, CustomError::Halted);
        if !self.profile.subscription {
            let fee = 100_000_000;
            
            system_program::transfer(
                CpiContext::new(
                    self.system_program.to_account_info(),
                    system_program::Transfer {
                        from: self.signer.to_account_info(),
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


        let token_data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new(
            self.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: self.signer.to_account_info(),
                update_authority: self.signer.to_account_info(),
                mint: self.mint.to_account_info(),
                metadata: self.metadata.to_account_info(),
                mint_authority: self.signer.to_account_info(),
                system_program: self.system_program.to_account_info(),
                rent: self.rent.to_account_info(),
            },
            
        );

        create_metadata_accounts_v3(
            metadata_ctx,
            token_data,
            false,
            true,
            None,
        )?;

        Ok(())
    }
}
    
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}