use anchor_lang::prelude::*;

declare_id!("D3EhymFwTs4ikkQWD3QcjVor48MidZTg497WdEBVKiYB");
pub mod states;
pub mod contexts;
pub use states::*;
pub use contexts::*;

#[program]
pub mod sagent {
    use super::*;
    pub fn init(ctx: Context<Initialize>, admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64)-> Result<()>{
        ctx.accounts.init(admin,fee_basis_points,subscription_price,subscription_allowance)
    }
    pub fn add_user(ctx: Context<AddUser>, name: String) -> Result<()>{
        ctx.accounts.add_user(name,ctx.bumps)
    }
    pub fn subscribe(ctx: Context<Subscribe>) -> Result<()>{
        ctx.accounts.subscribe()
    }
    pub fn close(ctx: Context<Close>) -> Result<()>{
        ctx.accounts.close()
    }


}


