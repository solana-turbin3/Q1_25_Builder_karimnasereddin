use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer_checked, MintTo, burn, TransferChecked};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use constant_product_curve::ConstantProduct;

use crate::state::Config;
use crate::error::AmmError;


#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub lp_provider : Signer<'info>, 
    pub mint_x: InterfaceAccount<'info, Mint>, 
    pub mint_y: InterfaceAccount<'info, Mint>,  
    #[account(
        has_one = mint_x, 
        has_one = mint_y, 
        seeds = [
            b"config", 
            mint_x.key().to_bytes().as_ref(),
            mint_y.key().to_bytes().as_ref(),
            config.seed.to_le_bytes().as_ref()    
        ],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
        mint::decimals = 6, 
        mint::authority = config
    )]

    pub mint_lp: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x, 
        associated_token::authority = config,
    )]
    pub vault_x: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_x,
    )]
    pub lp_provider_ata_x: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = lp_provider,
        associated_token::mint = mint_y,
    )]
    pub lp_provider_ata_y: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = lp_provider,
        associated_token::authority = lp_provider, 
        associated_token::mint = mint_lp, 
    )]
    pub lp_provider_ata_lp: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}