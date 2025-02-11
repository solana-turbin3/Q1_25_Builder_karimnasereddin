use anchor_lang::{
    prelude::*,
    system_program::{transfer,Transfer},
};

use crate::state::*;

#[derive(Accounts)]
#[instruction(seed: u128)]
pub struct PlaceBet<'info>{



}

impl<'info>PlaceBet<'info>{

    pub fn create_bet(
        &mut self,
        seed: u128,
        roll:u8,
        amount:u64,
        bumps: &PlaceBetBumps,
    ) -> Result<()>{
        self.bet.set_inner{Bet(
            
        )}
    }
}