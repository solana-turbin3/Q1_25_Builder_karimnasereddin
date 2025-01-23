use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{close_account, transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,CloseAccount}
};
use crate:: state::EscrowState;


#[derive(Accounts)]
#[instruction(seeds:u8)]
pub struct Take<'info>{
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    pub mint_a: InterfaceAccount<'info,Mint>,
    pub mint_b: InterfaceAccount<'info,Mint>,
    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=mint_a,
        associated_token::authority=taker
    )]
    pub taker_mint_a_ata:InterfaceAccount<'info,TokenAccount>,
    #[account(
        init_if_needed,
        payer=maker,
        associated_token::mint=mint_b,
        associated_token::authority=maker
    )]
    pub maker_mint_b_ata:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        associated_token::mint=mint_b,
        associated_token::authority=taker
    )]
    pub taker_mint_b_ata:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
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

impl<'info> Take<'info>{
    pub fn deposit(&mut self,amount:u64) -> Result<()>{
        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=TransferChecked{
            from:self.taker_mint_b_ata.to_account_info(),
            mint: self.mint_b.to_account_info(),
            to: self.maker_mint_b_ata.to_account_info(),
            authority: self.taker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
        transfer_checked(cpi_ctx,amount,self.mint_b.decimals)?;
        Ok(())
    }
    pub fn withdraw(&mut self,amount:u64) -> Result<()>{
        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=TransferChecked{
            from:self.taker_mint_b_ata.to_account_info(),
            mint: self.mint_b.to_account_info(),
            to: self.maker_mint_b_ata.to_account_info(),
            authority: self.taker.to_account_info(),

        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
        transfer_checked(cpi_ctx,amount,self.mint_b.decimals)?;

        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=TransferChecked{
            from:self.vault.to_account_info(),
            mint: self.mint_b.to_account_info(),
            to: self.taker_mint_b_ata.to_account_info(),
            authority: self.vault.to_account_info(),

        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
        transfer_checked(cpi_ctx,amount,self.mint_b.decimals)?;
        Ok(())
    }
    
    pub fn close_vault(&mut self)->Result<()>{
        let cpi_program=self.token_program.to_account_info();
        let cpi_accounts=CloseAccount{
            account:self.vault.to_account_info(),
            destination:self.taker.to_account_info(),
            authority:self.escrow.to_account_info(),
        };
        let cpi_ctx= CpiContext::new(
            cpi_program,
            cpi_accounts
            
        );
        close_account(cpi_ctx)?;
        Ok(())
    }
}