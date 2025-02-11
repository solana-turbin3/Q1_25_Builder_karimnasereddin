use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer},
};

use crate::{errors::AmmError, state::Config};
use constant_product_curve::ConstantProduct;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub lp_provider: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,

    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
        mint::decimals = 6,
        mint::authority = config,
      )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config
      )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config
      )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_x
    )]
    pub lp_provider_mint_x_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_y
    )]
    pub lp_provider_mint_y_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = lp_provider,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_lp,
    )]
    pub lp_provider_lp_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, claim_amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        let (x, y) = match self.mint_lp.supply == 0
            && self.vault_x.amount == 0
            && self.vault_y.amount == 0
        {
            true => (min_x, min_y),
            false => {
                let amounts = ConstantProduct::xy_withdraw_amounts_from_l(
                    self.vault_x.amount,
                    self.vault_y.amount,
                    self.mint_lp.supply,
                    claim_amount,
                    6,
                )
                .unwrap();
                (amounts.x, amounts.y)
            }
        };

        require!(min_x <= x && min_y <= y, AmmError::LiquidityLessThanMinimum);

        self.withdraw_token(true, x)?;
        self.withdraw_token(false, y)?;
        self.burn_lp_tokens(claim_amount)?;

        Ok(())
    }

    pub fn withdraw_token(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let (from, to) = match is_x {
            true => (
                self.vault_x.to_account_info(),
                self.lp_provider_mint_x_ata.to_account_info(),
            ),
            false => (
                self.vault_y.to_account_info(),
                self.lp_provider_mint_y_ata.to_account_info(),
            ),
        };

        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.config.to_account_info(),
        };

        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &self.config.config_bump.to_be_bytes(),
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn burn_lp_tokens(&mut self, amount: u64) -> Result<()> {
        let cpi_progam = self.token_program.to_account_info();

        let cpi_accounts = Burn {
            mint: self.mint_lp.to_account_info(),
            from: self.lp_provider_lp_ata.to_account_info(),
            authority: self.lp_provider.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_progam, cpi_accounts);

        burn(cpi_ctx, amount)?;

        Ok(())
    }
}