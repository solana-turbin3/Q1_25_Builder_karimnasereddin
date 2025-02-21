use anchor_lang::prelude::*;

use anchor_spl::token_interface::{Mint, TokenInterface};
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    mpl_token_metadata::types::DataV2,
    CreateMetadataAccountsV3, 
    Metadata as Metaplex,
};

#[derive(Accounts)]
#[instruction(params: InitTokenParams)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = params.decimals,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
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