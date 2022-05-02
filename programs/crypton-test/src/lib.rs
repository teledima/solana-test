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
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info()
            ],
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendLamports<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}
