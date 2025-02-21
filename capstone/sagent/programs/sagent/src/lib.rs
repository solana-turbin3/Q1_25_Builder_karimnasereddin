use anchor_lang::prelude::*;

declare_id!("D3EhymFwTs4ikkQWD3QcjVor48MidZTg497WdEBVKiYB");
pub mod states;
pub mod contexts;
pub use states::*;
pub use contexts::*;
pub mod errors;

#[program]
pub mod sagent {
    use super::*;
    pub fn init(ctx: Context<Initialize>, admin: Pubkey,fee_basis_points: u16, subscription_price: u64, subscription_allowance: u64)-> Result<()>{
        ctx.accounts.init(admin,fee_basis_points,subscription_price,subscription_allowance, &ctx.bumps)
    }
    pub fn add_user(ctx: Context<AddUser>, name: String) -> Result<()>{
        ctx.accounts.add_user(name,ctx.bumps)
    }
    pub fn subscribe(ctx: Context<Subscribe>) -> Result<()>{
        ctx.accounts.subscribe()
    }
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.execute_withdraw(amount)
    }
    pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> Result<()> {
        ctx.accounts.send_sol(amount)
    }
    pub fn send_token(ctx: Context<SendToken>, amount: u64) -> Result<()> {
        ctx.accounts.send_token(amount)
    }
    pub fn close(ctx: Context<Close>) -> Result<()>{
        ctx.accounts.close()
    }
    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        ctx.accounts.mint_token(amount)
    }
    pub fn create_mint(ctx: Context<CreateMint>, metadata: InitTokenParams) -> Result<()> {
        ctx.accounts.create_mint(metadata)
    }
    pub fn create_nft(ctx: Context<CreateNFT>, metadata: InitNFTParams) -> Result<()> {
        ctx.accounts.create_nft(metadata)
    }
    pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
        ctx.accounts.mint_nft()
    }
    pub fn send_nft(ctx: Context<SendNFT>) -> Result<()> {
        ctx.accounts.send_nft()
    }
}


