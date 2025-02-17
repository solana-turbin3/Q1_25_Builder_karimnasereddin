use anchor_lang::prelude::*;
use crate::states::Profile;


#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
      mut,
      seeds = [b"profile", initializer.key().as_ref()],
      bump=user.bump,
    )]
    pub user: Account<'info, Profile>, 
    pub system_program: Program<'info, System>,

}

impl<'info> Subscribe<'info> {
  pub fn subscribe(&mut self) -> Result<()> { 
    self.user.subscription=true;    
    self.user.remaining_tx=100;
    Ok(())
  }
}