use anchor_lang::prelude::*;

declare_id!("3jRGs6wCxECxgii1bWPT8E955mH29e7tksCrbGQZHAc2");

#[program]
pub mod crypton_test {
    use super::*;

    pub fn transfer(ctx: Context<SendLamports>, amount: u64) -> Result<()> {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.to.key(),
            amount
        );
        let transfer_result: Option<Result<()>> = match anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info()
            ],
        ) {
            Ok(_) => Some(Ok(())),
            Err(_) => None
        };

        match transfer_result {
            Some(_) => {
                let state = &mut ctx.accounts.account_state;
                state.amount += amount;
                Ok(())
            },
            None => {
                panic!()
            }
        }
    }

    pub fn new_state(ctx: Context<InitializeAccountState>) -> Result<()> {
        let state = &mut ctx.accounts.account_state;
        state.amount = 0;
        let acc_list = &mut ctx.accounts.account_list;
        acc_list.list.push(ctx.accounts.payer.key());
        Ok(()) 
    }

    pub fn new_list(ctx: Context<InitializeAccountListKeys>) -> Result<()> {
        let acc_list = &mut ctx.accounts.account_list;
        acc_list.list = Vec::new();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendLamports<'info> {
    #[account(mut)]
    pub from: Signer<'info>,

    #[account(mut)]
    pub to: AccountInfo<'info>,

    #[account(mut, seeds = [b"user-stat", from.key().as_ref()], bump)]
    pub account_state: Account<'info, AccountState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeAccountState<'info> {
    #[account(init, payer = payer, space = 8 + 8, seeds = [b"user-stat", payer.key().as_ref()], bump)]
    pub account_state: Account<'info, AccountState>,

    #[account(mut, seeds = [b"users-key"], bump)]
    pub account_list: Account<'info, AccountListKeys>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct InitializeAccountListKeys<'info> {
    #[account(init, payer = payer, space = 8 + 4 + 3200, seeds = [b"users-key"], bump)]
    pub account_list: Account<'info, AccountListKeys>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[account]
pub struct AccountState {
    amount: u64
}

#[account]
pub struct AccountListKeys {
    pub list: Vec<Pubkey>
}
