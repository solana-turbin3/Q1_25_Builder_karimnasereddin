use anchor_lang::{
    prelude::*,
    system_program::{transfer,Transfer},
};

use solana_program::{
    ed25519_program,hash::hash,sysvar::instructions::load_instruction_at_checked,
};

#[derive(Accounts)]
pub struct ResolveBet<'info>{
    #[account(mut)]
    pub house: Signer<'info>,
    #[account(mut)]
    pub player: SystemAccount<'info>
    #[account(
        mut.
        seeds=[b"vault",house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
}