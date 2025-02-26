// use anchor_lang::prelude::*;
// use anchor_spl::{
//     associated_token::AssociatedToken,
//     token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked, MintTo,mint_to}
// };
// use crate::{states::{Config, Profile}, errors::CustomError};

// #[derive(Accounts)]
// #[instruction(amount: u64)]
// pub struct MintToken<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,
//     #[account(
//     mut,
//     seeds = [b"profile", user.key().as_ref()],
//     bump = profile.bump,
//     )]
//     pub profile: Account<'info, Profile>,
//     #[account(
//     seeds = [b"config"],
//     bump = config.config_bump,
//     )]
//     pub config: Account<'info, Config>,
//     #[account(
//     seeds = [b"treasury"],
//     bump = config.treasury_bump,
//     )]
//     /// CHECK: Treasury account
//     pub treasury: SystemAccount<'info>,
//     #[account(
//         mut,
//         associated_token::mint = mint,
//         associated_token::authority = user,
//     )]
//     pub user_ata: InterfaceAccount<'info, TokenAccount>,
//     #[account(
//         mut,
//         associated_token::mint = mint,
//         associated_token::authority = treasury,
//     )]
//     pub treasury_ata: InterfaceAccount<'info, TokenAccount>,
//     #[account(mut)]
//     pub mint: InterfaceAccount<'info, Mint>,
    
//     pub system_program: Program<'info, System>,
//     pub associated_token_program: Program<'info,AssociatedToken>,
//     pub token_program: Interface<'info,TokenInterface>
// }

// impl<'info> MintToken<'info> {
//     pub fn mint_token(&mut self, amount: u64) -> Result<()> {
//         require_eq!(self.config.is_halted, false, CustomError::Halted);
//         let net_amount = if !self.profile.subscription {
//             let fee = amount
//                 .checked_mul(self.config.fee_basis_points.into())
//                 .and_then(|v| v.checked_div(10_000))
//                 .ok_or(CustomError::Overflow)?;
            
//                 let cpi_program=self.token_program.to_account_info();
//                 let cpi_accounts=TransferChecked{
//                     from:self.user_ata.to_account_info(),
//                     mint: self.mint.to_account_info(),
//                     to: self.treasury_ata.to_account_info(),
//                     authority: self.user.to_account_info(),
        
//                 };
//                 let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
//                 transfer_checked(cpi_ctx,fee,self.mint.decimals)?;
//             amount.checked_sub(fee).ok_or(CustomError::Overflow)?
//         } else {
//             // Directly modify the SendSol's profile account
//             self.profile.remaining_tx = self.profile.remaining_tx.checked_sub(1).ok_or(CustomError::Overflow)?;
//             if self.profile.remaining_tx == 0 {
//                 self.profile.subscription = false;
//             }
//             amount
//         };

//         let cpi_accounts = MintTo {
//             mint: self.mint.to_account_info(),
//             to: self.user_ata.to_account_info(),
//             authority: self.user.to_account_info(),
//         };
        
//         let cpi_ctx = CpiContext::new(
//             self.token_program.to_account_info(),
//             cpi_accounts
//         );
        
//         mint_to(cpi_ctx, net_amount)?;
//         Ok(())
//     }
//     }
    