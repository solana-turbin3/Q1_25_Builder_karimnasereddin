use anchor_lang::{prelude::*, system_program};
use crate::states::{Config, Profile};
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct SendSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
    mut,
    seeds = [b"profile", user.key().as_ref()],
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
    /// CHECK: Recipient account
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    }


    impl<'info> SendSol<'info> {

        pub fn send_sol(&mut self, amount: u64) -> Result<()> {
            require_eq!(self.config.is_halted, false, CustomError::Halted);
            // Remove TransferFee creation and handle fee logic directly
            let net_amount = if !self.profile.subscription {
                let fee = amount
                    .checked_mul(self.config.fee_basis_points.into())
                    .and_then(|v| v.checked_div(10_000))
                    .ok_or(CustomError::Overflow)?;
                
                system_program::transfer(
                    CpiContext::new(
                        self.system_program.to_account_info(),
                        system_program::Transfer {
                            from: self.user.to_account_info(),
                            to: self.treasury.to_account_info(),
                        }
                    ),
                    fee
                )?;
                amount.checked_sub(fee).ok_or(CustomError::Overflow)?
            } else {
                // Directly modify the SendSol's profile account
                self.profile.remaining_tx = self.profile.remaining_tx.checked_sub(1).ok_or(CustomError::Overflow)?;
                if self.profile.remaining_tx == 0 {
                    self.profile.subscription = false;
                }
                amount
            };

            system_program::transfer(
                CpiContext::new(
                    self.system_program.to_account_info(),
                    system_program::Transfer {
                        from: self.user.to_account_info(),
                        to: self.recipient.to_account_info(),
                    }
                ),
                net_amount
            )?;
            Ok(())
        }
    }