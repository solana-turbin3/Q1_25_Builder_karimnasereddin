use anchor_lang::prelude::*;

declare_id!("3r61Qh4RCkrP3ETrQB4gNdDkiAtftbgpbDBVsr2vCZYc");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
