use anchor_lang::prelude::*;
use crate::states::Profile;


#[derive(Accounts)]
#[instruction(name: String)]
pub struct AddUser<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
      init,
      payer = initializer,
      space= 8+ Profile::INIT_SPACE,
      seeds = [b"profile", initializer.key().as_ref()],
      bump,
    )]
    pub user: Account<'info, Profile>,

    
  pub system_program: Program<'info, System>,

}

impl<'info> AddUser<'info> {
  pub fn add_user(&mut self, name: String, bumps: AddUserBumps) -> Result<()> {
    self.user.set_inner(Profile {
        name: name,
        subscription: false,
        remaining_tx: 0,
        bump: bumps.user,
    });
    Ok(())
  }
}