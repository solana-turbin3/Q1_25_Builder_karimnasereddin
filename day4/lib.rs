use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

declare_id!("5Ar9ok5cd5iQ4Lc8JVfEwi6dtedKKZsTVN6qoMZjAKD9");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps)?;
        Ok(())
    }
    pub fn deposit(ctx:Context<Deposit>,amount:u64)->Result<()>{
        ctx.accounts.deposit(amount)?;
        Ok(())
    }
    pub fn withdraw(ctx:Context<Withdraw>,amount:u64)->Result<()>{
        ctx.accounts.withdraw(amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer=signer,
        space= VaultState::INIT_SPACE+8,
        seeds=[b"state",signer.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info,VaultState>,
    #[account(
        seeds=[vault_state.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info,System>

}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds=[b"state",signer.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info,VaultState>,
    #[account(
        mut,
        seeds=[vault_state.key().as_ref()],
        bump=vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info,System>

}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds=[b"state",signer.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info,VaultState>,
    #[account(
        mut,
        seeds=[vault_state.key().as_ref()],
        bump=vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info,System>

}

#[account]
#[derive(InitSpace)]
pub struct VaultState{
    pub state_bump:u8,
    pub vault_bump:u8
}

impl<'info> Initialize<'info>{
    pub fn initialize(&mut self,bumps:InitializeBumps)->Result<()>{
        self.vault_state.state_bump=bumps.vault_state;
        self.vault_state.vault_bump=bumps.vault;
        Ok(())
    }
}

impl<'info> Deposit<'info>{
    pub fn deposit(&mut self,amount:u64)->Result<()>{
        let system_program=self.system_program.to_account_info();
        let accounts = Transfer{
            from:self.signer.to_account_info(),
            to: self.vault.to_account_info()
        };
        let cpi_ctx=CpiContext::new(system_program,accounts);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

impl<'info> Withdraw<'info>{
    pub fn withdraw(&mut self,amount:u64)->Result<()>{
        assert!(amount<=self.vault.lamports());
        let system_program=self.system_program.to_account_info();
        let accounts = Transfer{
            from:self.vault.to_account_info(),
            to: self.signer.to_account_info()
        };
        let cpi_ctx=CpiContext::new(system_program,accounts);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

