use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{close_account,transfer_checked,Mint,TokenAccount,TokenInterface, TransferChecked,CloseAccount},
};
use crate::state::EscrowState;

#[derive(Accounts)]
#[instruction(seeds:u8)]
pub struct Refund<'info>{
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: InterfaceAccount<'info,Mint>,
    pub mint_b: InterfaceAccount<'info,Mint>,
    #[account(
        init_if_needed,
        payer=maker,
        associated_token::mint=mint_a,
        associated_token::authority=maker
    )]
    pub maker_mint_a_ata:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        close=maker,
        seeds=[b"escrow",maker.key.as_ref(),escrow.seed.to_le_bytes().as_ref()],
        bump=escrow.bump
    )]
    pub escrow: Account<'info,EscrowState>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=escrow)]
    pub vault: InterfaceAccount<'info,TokenAccount>,
    pub system_program: Program<'info,System>,
    pub associated_token_program: Program<'info,AssociatedToken>,
    pub token_program: Interface<'info,TokenInterface>

}

impl<'info> Refund<'info>{
    pub fn withdraw_and_close(&mut self) -> Result<()>{
        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=TransferChecked{
            from:self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.maker_mint_a_ata.to_account_info(),
            authority: self.escrow.to_account_info(),

        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
        transfer_checked(cpi_ctx,self.vault.amount,self.mint_a.decimals)?;
        let close_program=self.token_program.to_account_info();
        let close_accounts=CloseAccount{
            account:self.vault.to_account_info(),
            destination:self.maker.to_account_info(),
            authority:self.escrow.to_account_info(),
        };
        let cpi_ctx= CpiContext::new(
            close_program,
            close_accounts
            
        );
        close_account(cpi_ctx)?;
        Ok(())
    }
}