use anchor_lang::prelude::*;

declare_id!("2CPmcnQGKNhMAwERs75C2QUKbhoX31pCe7xpEBfaqTYr");

pub mod instructions;
pub mod state;
pub mod errors;

pub use instructions::*;
pub use errors::*;


#[program]
pub mod nft_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
