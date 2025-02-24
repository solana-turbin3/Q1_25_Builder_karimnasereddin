use anchor_lang::prelude::*;
use crate::states::Profile;


#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
      mut,
      close = initializer, 
      seeds = [b"profile", initializer.key().as_ref()],
      bump=user.bump,
    )]
    pub user: Account<'info, Profile>, 
    pub system_program: Program<'info, System>,

}

impl<'info> Close<'info> {
  pub fn close(&mut self) -> Result<()> { 
    Ok(())
  }
}