import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Sagent } from "../target/types/sagent";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY,Keypair, Commitment, SetComputeUnitLimitParams, ComputeBudgetProgram  } from "@solana/web3.js";
import { assert } from "chai";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, createSyncNativeInstruction, Account } from "@solana/spl-token";

const commitment: Commitment = "confirmed";
 // Helper function to log a message  
 const log = async (signature: string): Promise<string> => {
  console.log(
    `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}\n`
  );
  return signature;
};

const confirmTx = async (signature: string) => {
  const latestBlockhash = await anchor.getProvider().connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    commitment
  )
}

const confirmTxs = async (signatures: string[]) => {
  await Promise.all(signatures.map(confirmTx))
}

 // Address of the Raydium Cpmm program on devnet
 const CPMM_PROGRAM_ID = new anchor.web3.PublicKey(
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
);
// Address of the Locking CPMM program on devnet
const LOCK_CPMM_PROGRAM_ID = new anchor.web3.PublicKey(
  "LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE"
);

// Address of the Locking CPMM program on devnet
const LOCK_CPMM_AUTHORITY_ID = new anchor.web3.PublicKey(
  "3f7GcQFG397GAaEnv51zR6tsTVihYRydnydDD1cXekxH"
);

// Address of the Raydium AMM configuration account on mainnet
const AMM_CONFIG_ID = new anchor.web3.PublicKey(
  "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"
);

// Address of the Token Metadata program
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const MEMO_PROGRAM = new anchor.web3.PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Address of the Rent program
const RENT_PROGRAM = anchor.web3.SYSVAR_RENT_PUBKEY;

// Create pool fee receiver
// Mainnet DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8
// Devnet G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2
const create_pool_fee = new anchor.web3.PublicKey(
  "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"
);

const WSOL_ID = new anchor.web3.PublicKey(
  "So11111111111111111111111111111111111111112"
);
// Define keypairs for different roles
const [initializer, mint, fee_nft_mint] =
  [new Keypair(), new Keypair(), new Keypair()];

// This variable is the base vault account.
let creator_base_ata: PublicKey;

// This variable is the token vault account.
let creator_token_ata: PublicKey;

// Raydium Observation State PDA
let observation_state: PublicKey;

// Raydium Pool PDA
let pool_state: PublicKey;

// Raydium Pool vault and lp mint authority PDA
let authority: PublicKey;

// Raydium base mint vault & token mint vault
let token_vault_0: PublicKey;
let token_vault_1: PublicKey;

// Raydium lp_mint
let lp_mint: PublicKey;

// lp mint ata
let lp_mint_ata: PublicKey;

// nft_mint_acc locked
let nft_mint_acc: PublicKey;

// locked pda 
let locked_liquidity: PublicKey;

// locked pda 
let locked_lp_vault: PublicKey;

const metadata = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    fee_nft_mint.publicKey.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
)[0];
describe("sagent", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Sagent as Program<Sagent>;
  const admin = anchor.web3.Keypair.generate();
  const initializer2 = anchor.web3.Keypair.generate();
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  const mint_nft=anchor.web3.Keypair.generate();
  const recipientS = anchor.web3.Keypair.generate();
  const recipientN = anchor.web3.Keypair.generate();
  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("config")],
    program.programId
  );
  const [treasuryPda, treasuryBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("treasury")],
    program.programId
  );
  const [profilePDA, profileBump] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("profile"),
      initializer.publicKey.toBuffer(),
    ],
    program.programId
  );
  const [profilePDA2, profileBump2] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("profile"),
      initializer2.publicKey.toBuffer(),
    ],
    program.programId
  );
  it("Initialize Sagent Protocol and Config", async () => {
    
    // Funding the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      admin.publicKey,
      1* LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(adminAirdrop);
    // Execute the transaction
    const tx = await program.methods
      .init(
        admin.publicKey,
        100,
        new BN(5_000_000_000),
        new BN(500)
      ) 
      .accounts({
        config:configPda,
        treasury:treasuryPda,
        admin:admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const configAccounts=await program.account.config.fetch(configPda)
    
  });
    it("Update Sagent Protocol and Config", async () => {
    
    // Funding the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      admin.publicKey,
      1* LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(adminAirdrop);
    // Execute the transaction
    const tx = await program.methods
      .update(
        admin.publicKey,
        100,
        new BN(1_000_000_000),
        new BN(100),
        false,
      ) 
      .accounts({
        config:configPda,
        treasury:treasuryPda,
        admin:admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const configAccounts=await program.account.config.fetch(configPda)
    
  });
  it("Fake admin cannot update Sagent Protocol and Config", async () => {
    const fakeAdmin = anchor.web3.Keypair.generate();
    // Funding the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      fakeAdmin.publicKey,
      10* LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(adminAirdrop);
    // Execute the transaction
    try {
      await program.methods
        .update(
          fakeAdmin.publicKey,
          100,
          new BN(999_000_000_000),
          new BN(900),
          true,
      ) 
      .accounts({
        config:configPda,
        treasury:treasuryPda,
        admin:fakeAdmin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([fakeAdmin])
      .rpc();
    } catch (error) {
      assert(error.message,"Error Code: Unauthorized");
      return;
    }
    throw new Error("Should have failed but didn't");
    
  });
  it("Create User profile (Kira)", async () => {
    
    const name = "Kira";


    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer.publicKey,
      7.5*LAMPORTS_PER_SOL 
    );
    await program.provider.connection.confirmTransaction(initializerAirdrop);

    // Execute the transaction
    const tx = await program.methods.addUser(name) 
      .accounts({
        user:profilePDA,
        initializer: initializer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer])
      .rpc();
      let n= await (await program.account.profile.fetch(profilePDA)).name.toString()
      
  });
  it("Kira has Subscribed", async () => {


    // Execute the transaction
    const tx = await program.methods
      .subscribe() 
      .accounts({
        user:profilePDA,
        initializer: initializer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer])
      .rpc();
      let n= await (await program.account.profile.fetch(profilePDA)).name.toString()
  });
  it("Create Second User profile (Bob)", async () => {
    
    const name = "Bob";

    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer2.publicKey,
      100*LAMPORTS_PER_SOL // 2SOL
    );
    await program.provider.connection.confirmTransaction(initializerAirdrop);

    // Execute the transaction
    const tx = await program.methods.addUser(name) 
      .accounts({
        user:profilePDA2,
        initializer: initializer2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer2])
      .rpc();
      let n= await (await program.account.profile.fetch(profilePDA2)).name.toString();
      

  });
  it("Kira (sub) invokes Send 1 SOL function to recipient", async () => {
    const amount = new BN(1 * LAMPORTS_PER_SOL);
    const tx = await program.methods.sendSol(amount)
    .accounts({
      user:initializer.publicKey,
      profile:profilePDA,
      config:configPda,
      treasury:treasuryPda,
      recipient:recipientS.publicKey,
      systemProgram:SystemProgram.programId,
  }).signers([initializer])
  .rpc();
  });
  

it("Bob (non-sub) invokes Send 1 SOL function to recipient", async () => {
  const amount = new BN(1 * LAMPORTS_PER_SOL);
  const tx = await program.methods.sendSol(amount)
  .accounts({
    user:initializer2.publicKey,
    profile:profilePDA2,
    config:configPda,
    treasury:treasuryPda,
    recipient:recipientN.publicKey,
    systemProgram:SystemProgram.programId,
}).signers([initializer2])
.rpc();
});

 





it("Admin withdraws 0.5 SOL from treasury to recipient", async () => {
    const recipient = anchor.web3.Keypair.generate();
    const amount = new BN(0.5 * LAMPORTS_PER_SOL);
    const tx = await program.methods.withdraw(amount)
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        treasury: treasuryPda,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([admin])
      .rpc();

    
  });
 
 
 
 
 
 
 
 
 
 
 
 
  it("Fake admin cannot withdraw funds", async () => {
    const maliciousAdmin = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();
    const amount = new BN(0.5 * LAMPORTS_PER_SOL);

    // Fund malicious admin for fees
    const airdrop = await program.provider.connection.requestAirdrop(
      maliciousAdmin.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(airdrop);

    try {
      await program.methods.withdraw(amount)
        .accounts({
          admin: maliciousAdmin.publicKey,  // Using unauthorized admin
          config: configPda,
          treasury: treasuryPda,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([maliciousAdmin])
        .rpc();
    } catch (error) {
      assert(error.message,"Error Code: Unauthorized");
      return;
    }

    throw new Error("Should have failed but didn't");
    
  });
 
 
 
 
 
 
 
  it("Setup Token Mint", async () => {
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    let metadata={
      name:"dogwifhat",
      symbol:"$WIF",
      uri:"https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
      decimals:6,
    }
    const tx = await program.methods.createMint(metadata).
    accountsPartial({
      profile:profilePDA,
      config:configPda,
      treasury:treasuryPda,
      metadata: metadataAddress,
      mint:mint.publicKey,
      signer:initializer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([initializer,mint])
    .rpc();
    
  });
  it("Non-sub Setup Token Mint", async () => {
    const mint2=anchor.web3.Keypair.generate();
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint2.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    let metadata={
      name:"catwiftats",
      symbol:"$CIT",
      uri:"https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
      decimals:6,
    }
    const tx = await program.methods.createMint(metadata).
    accountsPartial({
      profile:profilePDA2,
      config:configPda,
      treasury:treasuryPda,
      metadata: metadataAddress,
      mint:mint2.publicKey,
      signer:initializer2.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([initializer2,mint2])
    .rpc();
    
  });
  
  it("Subscriber Setting up accounts for pool creation and wrapping SOL\n", async () => {
    await Promise.all([initializer].map(async (k) => {
      return await anchor.getProvider().connection.requestAirdrop(k.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    })).then(confirmTxs);

    // PDA address for the pool_state
    pool_state = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        AMM_CONFIG_ID.toBuffer(),
        WSOL_ID.toBuffer(),
        mint.publicKey.toBuffer()
      ],
      CPMM_PROGRAM_ID
    )[0];

    observation_state = PublicKey.findProgramAddressSync(
      [
        Buffer.from("observation"),
        pool_state.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the token vault for token0 (WSOL)
    token_vault_0 = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_vault"),
        pool_state.toBuffer(),
        WSOL_ID.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the token vault for token1 (mint)
    token_vault_1 = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_vault"),
        pool_state.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // Pda address for the Raydium vault lp auth
    authority = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_and_lp_mint_auth_seed"),
      ],
      CPMM_PROGRAM_ID
    )[0];

    lp_mint = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_lp_mint"),
        pool_state.toBuffer()
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the pool_state
    locked_liquidity = PublicKey.findProgramAddressSync(
      [
        Buffer.from("locked_liquidity"),
        fee_nft_mint.publicKey.toBuffer()
      ],
      LOCK_CPMM_PROGRAM_ID
    )[0];

    creator_base_ata = (await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      WSOL_ID,
      initializer.publicKey
    )).address;
    // Amount of SOL to wrap (2 SOL in lamports)
    const amountToWrap = 20 * anchor.web3.LAMPORTS_PER_SOL;

    // Send transaction to wrap SOL
    const wrapTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: initializer.publicKey, // Sender (creator)
        toPubkey: creator_base_ata, // Associated token account for WSOL
        lamports: amountToWrap, // Amount to transfer (2 SOL)
      }),
      createSyncNativeInstruction(creator_base_ata) // Sync native balance with token balance
    );
    // Sign and send the transaction
    await anchor.web3.sendAndConfirmTransaction(program.provider.connection, wrapTx, [initializer]);


    creator_token_ata = getAssociatedTokenAddressSync(mint.publicKey, initializer.publicKey);

    nft_mint_acc = getAssociatedTokenAddressSync(fee_nft_mint.publicKey, initializer.publicKey);

    lp_mint_ata = getAssociatedTokenAddressSync(lp_mint, initializer.publicKey);

    locked_lp_vault = getAssociatedTokenAddressSync(lp_mint, LOCK_CPMM_AUTHORITY_ID, true);

  });
  let [lookupTableInst, lookupTableAddress]: [anchor.web3.TransactionInstruction, anchor.web3.PublicKey] = [null, null];
  let lookupTableAccount: anchor.web3.AddressLookupTableAccount = null;
  // It creates an ALT
  it("Subscriber Initialize Address Lookup Table \n", async () => {

    const slot = await program.provider.connection.getSlot();

    [lookupTableInst, lookupTableAddress] =
      anchor.web3.AddressLookupTableProgram.createLookupTable({
        authority: initializer.publicKey,
        payer: initializer.publicKey,
        recentSlot: slot,
      });

    const extendInstruction = anchor.web3.AddressLookupTableProgram.extendLookupTable({
      payer: initializer.publicKey,
      authority: initializer.publicKey,
      lookupTable: lookupTableAddress,
      addresses: [
        SystemProgram.programId,
        program.programId,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_METADATA_PROGRAM_ID,
        CPMM_PROGRAM_ID,
        RENT_PROGRAM,
        create_pool_fee,
        AMM_CONFIG_ID,
        WSOL_ID
        // list more publicKey addresses here
      ],
    });
    lookupTableAccount = (
      await program.provider.connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    // fetching the latest blockhash
    let blockhash = await program.provider.connection
      .getLatestBlockhash()
      .then(res => res.blockhash);

    lookupTableAccount = (
      await program.provider.connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    // creating a versioned message instead of leagacy
    const messageV0 = new anchor.web3.TransactionMessage({
      payerKey: initializer.publicKey,
      recentBlockhash: blockhash,
      instructions: [lookupTableInst, extendInstruction]
    }).compileToV0Message([])

    // creating a versioned tx and using that to sendTransaction to avoid deprecation
    const transaction = new anchor.web3.VersionedTransaction(messageV0);

    // sign your transaction with the required `Signers`
    transaction.sign([initializer]);

    // Step 3: Send and confirm the transaction with rpc skip preflight
    const sig = await
      anchor.getProvider()
        .connection
        // since we have already signed the tx, no need to pass the signers array again
        .sendTransaction(
          transaction,
          {
            skipPreflight: true,
          }
        )
    // Confirm txn
    await program.provider.connection.confirmTransaction(sig);

    await new Promise(f => setTimeout(f, 1000));
  });

  it("Subscriber creates CPMM Pool and lock LP", async () => {
    const funding_amount=new BN(10*LAMPORTS_PER_SOL)
    const createCpmmPool = await program.methods
    .createCpmmPool(
      funding_amount
  )
    .accountsPartial({
      config:configPda,
      cpSwapProgram: CPMM_PROGRAM_ID,
      creator: initializer.publicKey,
      ammConfig: AMM_CONFIG_ID,
      authority: authority,
      poolState: pool_state,
      baseMint: WSOL_ID,
      tokenMint: mint.publicKey,
      lpMint: lp_mint,
      creatorBaseAta: creator_base_ata,
      creatorTokenAta: creator_token_ata,
      creatorLpToken: lp_mint_ata,
      token0Vault: token_vault_0,
      token1Vault: token_vault_1,
      createPoolFee: create_pool_fee,
      observationState: observation_state,
      tokenProgram: TOKEN_PROGRAM_ID,
      token1Program: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: RENT_PROGRAM

    })
    .signers([initializer, mint])
    .instruction()

    const lockCpiIx = await program.methods
    .lockCpmmLiquidity(
  )
    .accountsPartial({
      cpSwapProgram: CPMM_PROGRAM_ID,
      lockCpmmProgram: LOCK_CPMM_PROGRAM_ID,
      creator: initializer.publicKey,
      ammConfig: AMM_CONFIG_ID,
      authority: LOCK_CPMM_AUTHORITY_ID,
      feeNftMint: fee_nft_mint.publicKey,
      feeNftAcc: nft_mint_acc,
      poolState: pool_state,
      lockedLiquidity: locked_liquidity,
      lpMint: lp_mint,
      liquidityOwnerLp: lp_mint_ata,
      lockedLpVault: locked_lp_vault,
      token0Vault: token_vault_0,
      token1Vault: token_vault_1,
      metadata: metadata,
      metadataProgram: TOKEN_METADATA_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: RENT_PROGRAM,
      tokenProgram: TOKEN_PROGRAM_ID,
      baseMint: WSOL_ID,
      tokenMint: mint.publicKey

    })
    .signers([initializer, fee_nft_mint]) // Signer of the transaction
    .instruction()


    let blockhash = await program.provider.connection
    .getLatestBlockhash()
    .then(res => res.blockhash);

  const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 } as SetComputeUnitLimitParams);

  lookupTableAccount = (
    await program.provider.connection.getAddressLookupTable(lookupTableAddress)
  ).value;

  // creating a versioned message instead of leagacy
  const messageV0 = new anchor.web3.TransactionMessage({
    payerKey: initializer.publicKey,
    recentBlockhash: blockhash,
    instructions: [setComputeUnitLimitIx, createCpmmPool, lockCpiIx]
  }).compileToV0Message([lookupTableAccount])

  // creating a versioned tx and using that to sendTransaction to avoid deprecation
  const transaction = new anchor.web3.VersionedTransaction(messageV0);

  // sign your transaction with the required `Signers`
  transaction.sign([initializer, mint, fee_nft_mint]);
  // Step 3: Send and confirm the transaction with rpc skip preflight
  const sig = await
    anchor.getProvider()
      .connection
      // since we have already signed the tx, no need to pass the signers array again
      .sendTransaction(
        transaction,
        {
          skipPreflight: true,
        }
      )
  // Confirm txn
  await program.provider.connection.confirmTransaction(sig);

});
// it("Pause for CPMM Pool Creation", (done) => {
//   setTimeout(() => done(), 30_000);
// }).timeout(30_000);
it("Subscriber Swap WSOL to SPL Token via Raydium", async () => {
  creator_base_ata = (await getOrCreateAssociatedTokenAccount(
    program.provider.connection,
    initializer,
    WSOL_ID,
    initializer.publicKey
  )).address;
  let wrap_amount = 10*LAMPORTS_PER_SOL
  let wrap_tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: initializer.publicKey,
      toPubkey: creator_base_ata,
      lamports: wrap_amount,
    })
  );
  await anchor.web3.sendAndConfirmTransaction(program.provider.connection, wrap_tx, [initializer]);
  try {
  let treasury_ata33=await getOrCreateAssociatedTokenAccount(
    program.provider.connection,
    initializer,
    WSOL_ID,
    treasuryPda,
    true
  );

  let amount_in = new BN(1*LAMPORTS_PER_SOL); 
  await new Promise(f => setTimeout(f, 1000));
  const swapIx = await program.methods
    .swap(amount_in, new BN(500)
  )
    .accountsPartial({
      profile:profilePDA,
      config:configPda,
      treasury:treasuryPda,
      treasuryAta:treasury_ata33.address,
      cpSwapProgram: CPMM_PROGRAM_ID,
      creator: initializer.publicKey,
      authority: authority,
      ammConfig: AMM_CONFIG_ID,
      poolState: pool_state,
      inputTokenAccount: creator_base_ata,
      outputTokenAccount: creator_token_ata,
      inputVault: token_vault_0,
      outputVault: token_vault_1,
      inputTokenProgram: TOKEN_PROGRAM_ID,
      outputTokenProgram: TOKEN_PROGRAM_ID,
      inputTokenMint: WSOL_ID,
      outputTokenMint: mint.publicKey,
      observationState: observation_state,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .signers([initializer]).rpc();


} catch (error) {
  console.error("\UNIT TEST *Swap* ERROR -", error.message);
}
});


  
  
  
  
  
  it("Subscriber sends 500 tokens without fee", async () => {
    let amount = new BN(500); // 500 tokens with decimals
    let amount2=new BN(1000)
    let user_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      initializer.publicKey,
    );
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      recipientS.publicKey,
    );
    const treasuryAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      treasuryPda,
      true,
    );
    let initializer2_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      mint.publicKey,
      initializer2.publicKey,
    );
    
    const tx = await program.methods.sendToken(amount)
    .accountsPartial({
      user:initializer.publicKey,
      recipient:recipientS.publicKey,
      mint:mint.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer])
    .rpc();

    //Funding the non-subscriber with some tokens
    const tx2 = await program.methods.sendToken(amount2)
    .accountsPartial({
      user:initializer.publicKey,
      recipient:initializer2.publicKey,
      mint:mint.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer])
    .rpc();

    
  });
  it("Non-Subscriber Setting up accounts for pool state and wrapping SOL\n", async () => {
    await Promise.all([initializer2].map(async (k) => {
      return await anchor.getProvider().connection.requestAirdrop(k.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    })).then(confirmTxs);

    // PDA address for the pool_state
    pool_state = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        AMM_CONFIG_ID.toBuffer(),
        WSOL_ID.toBuffer(),
        mint.publicKey.toBuffer()
      ],
      CPMM_PROGRAM_ID
    )[0];

    observation_state = PublicKey.findProgramAddressSync(
      [
        Buffer.from("observation"),
        pool_state.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the token vault for token0 (WSOL)
    token_vault_0 = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_vault"),
        pool_state.toBuffer(),
        WSOL_ID.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the token vault for token1 (mint)
    token_vault_1 = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_vault"),
        pool_state.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      CPMM_PROGRAM_ID
    )[0];

    // Pda address for the Raydium vault lp auth
    authority = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_and_lp_mint_auth_seed"),
      ],
      CPMM_PROGRAM_ID
    )[0];

    lp_mint = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_lp_mint"),
        pool_state.toBuffer()
      ],
      CPMM_PROGRAM_ID
    )[0];

    // PDA address for the pool_state
    locked_liquidity = PublicKey.findProgramAddressSync(
      [
        Buffer.from("locked_liquidity"),
        fee_nft_mint.publicKey.toBuffer()
      ],
      LOCK_CPMM_PROGRAM_ID
    )[0];

    creator_base_ata = (await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      WSOL_ID,
      initializer2.publicKey
    )).address;
    // Amount of SOL to wrap (2 SOL in lamports)
    const amountToWrap = 2 * anchor.web3.LAMPORTS_PER_SOL;

    // Send transaction to wrap SOL
    const wrapTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: initializer2.publicKey, // Sender (creator)
        toPubkey: creator_base_ata, // Associated token account for WSOL
        lamports: amountToWrap, // Amount to transfer (2 SOL)
      }),
      createSyncNativeInstruction(creator_base_ata) // Sync native balance with token balance
    );
    // Sign and send the transaction
    await anchor.web3.sendAndConfirmTransaction(program.provider.connection, wrapTx, [initializer2]);


    creator_token_ata = getAssociatedTokenAddressSync(mint.publicKey, initializer2.publicKey);

    nft_mint_acc = getAssociatedTokenAddressSync(fee_nft_mint.publicKey, initializer2.publicKey);

    lp_mint_ata = getAssociatedTokenAddressSync(lp_mint, initializer2.publicKey);

    locked_lp_vault = getAssociatedTokenAddressSync(lp_mint, LOCK_CPMM_AUTHORITY_ID, true);

  });
  let [lookupTableInst2, lookupTableAddress2]: [anchor.web3.TransactionInstruction, anchor.web3.PublicKey] = [null, null];
  let lookupTableAccount2: anchor.web3.AddressLookupTableAccount = null;
  // It creates an ALT
  it(" Non-Subscriber Initialize Address Lookup Table \n", async () => {

    const slot = await program.provider.connection.getSlot();

    [lookupTableInst2, lookupTableAddress2] =
      anchor.web3.AddressLookupTableProgram.createLookupTable({
        authority: initializer2.publicKey,
        payer: initializer2.publicKey,
        recentSlot: slot,
      });

    const extendInstruction = anchor.web3.AddressLookupTableProgram.extendLookupTable({
      payer: initializer2.publicKey,
      authority: initializer2.publicKey,
      lookupTable: lookupTableAddress2,
      addresses: [
        SystemProgram.programId,
        program.programId,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_METADATA_PROGRAM_ID,
        CPMM_PROGRAM_ID,
        RENT_PROGRAM,
        create_pool_fee,
        AMM_CONFIG_ID,
        WSOL_ID
        // list more publicKey addresses here
      ],
    });
    lookupTableAccount2 = (
      await program.provider.connection.getAddressLookupTable(lookupTableAddress2)
    ).value;

    // fetching the latest blockhash
    let blockhash = await program.provider.connection
      .getLatestBlockhash()
      .then(res => res.blockhash);

    lookupTableAccount2 = (
      await program.provider.connection.getAddressLookupTable(lookupTableAddress2)
    ).value;

    // creating a versioned message instead of leagacy
    const messageV0 = new anchor.web3.TransactionMessage({
      payerKey: initializer2.publicKey,
      recentBlockhash: blockhash,
      instructions: [lookupTableInst2, extendInstruction]
    }).compileToV0Message([])

    // creating a versioned tx and using that to sendTransaction to avoid deprecation
    const transaction = new anchor.web3.VersionedTransaction(messageV0);

    // sign your transaction with the required `Signers`
    transaction.sign([initializer2]);

    // Step 3: Send and confirm the transaction with rpc skip preflight
    const sig = await
      anchor.getProvider()
        .connection
        // since we have already signed the tx, no need to pass the signers array again
        .sendTransaction(
          transaction,
          {
            skipPreflight: true,
          }
        )
    // Confirm txn
    await program.provider.connection.confirmTransaction(sig);

    await new Promise(f => setTimeout(f, 1000));
  });
  it("Non-Subscriber Swap WSOL to SPL Token via Raydium", async () => {
    let creator_base_ata = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      WSOL_ID,
      initializer2.publicKey
    );
        try {
    let treasury_ata33=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      WSOL_ID,
      treasuryPda,
      true
    );

  
    let amount_in = new BN(1*LAMPORTS_PER_SOL); 
    await new Promise(f => setTimeout(f, 1000));
    const swapIx = await program.methods
      .swap(amount_in, new BN(500)
    )
      .accountsPartial({
        profile:profilePDA2,
        config:configPda,
        treasury:treasuryPda,
        treasuryAta:treasury_ata33.address,
        cpSwapProgram: CPMM_PROGRAM_ID,
        creator: initializer2.publicKey,
        authority: authority,
        ammConfig: AMM_CONFIG_ID,
        poolState: pool_state,
        inputTokenAccount: creator_base_ata.address,
        outputTokenAccount: creator_token_ata,
        inputVault: token_vault_0,
        outputVault: token_vault_1,
        inputTokenProgram: TOKEN_PROGRAM_ID,
        outputTokenProgram: TOKEN_PROGRAM_ID,
        inputTokenMint: WSOL_ID,
        outputTokenMint: mint.publicKey,
        observationState: observation_state,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([initializer2]).rpc();
  
  
  } catch (error) {
    console.error("\UNIT TEST *Swap* ERROR -", error.message);
  }
  });

  
  
  it("Non-subscriber sends 500 tokens with fee", async () => {
    const amount = new BN(500); // 500 tokens with decimals
    
    let user_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      mint.publicKey,
      initializer2.publicKey,
    );
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      recipientN.publicKey,
    );
    const treasuryAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      treasuryPda,
      true,
    );

    const tx = await program.methods.sendToken(amount)
    .accountsPartial({
      user:initializer2.publicKey,
      recipient:recipientN.publicKey,
      mint:mint.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer2])
    .rpc();
    
  });
  
  
  
  
  
  
  
  it("Setup NFT Mint", async () => {
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint_nft.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    let metadata={
      name:"Rugs and Stuff",
      symbol:"RUG",
      uri:"https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
      decimals:0,
    }
    const tx = await program.methods.createNft(metadata).
    accountsPartial({
      metadata: metadataAddress,
      mint:mint_nft.publicKey,
      signer:initializer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([initializer,mint_nft])
    .rpc();

    
  });
  
  
  
  
  
  
  
  
  
  
  it("Mint NFT to subscriber", async () => {
    let user_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint_nft.publicKey,
      initializer.publicKey,
    );

    const tx = await program.methods.mintNft()
    .accountsPartial({
      user:initializer.publicKey,
      mint:mint_nft.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer])
    .rpc();
    
  });
  
  
  
  
  
  
  
  
  it("Sending NFT to recipient", async () => {
    

    let user_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint_nft.publicKey,
      initializer.publicKey,
    );
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint_nft.publicKey,
      recipientS.publicKey,
    );


    const tx = await program.methods.sendNft()
    .accountsPartial({
      user:initializer.publicKey,
      recipient:recipientS.publicKey,
      mint:mint_nft.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer])
    .rpc();
    
  });




  it("Log all protocol statistics", async () => {
    const configAccounts = await program.account.config.fetch(configPda);
    const treasuryBalance = await program.provider.connection.getBalance(treasuryPda);
    const recipientSAta=await getOrCreateAssociatedTokenAccount(program.provider.connection,initializer,mint.publicKey,recipientS.publicKey,true)
    const recipientSNFT=await getOrCreateAssociatedTokenAccount(program.provider.connection,initializer,mint_nft.publicKey,recipientS.publicKey,true)
    const recipientNAta=await getOrCreateAssociatedTokenAccount(program.provider.connection,initializer,mint.publicKey,recipientN.publicKey,true)
    const treasuryAta=await getOrCreateAssociatedTokenAccount(program.provider.connection,initializer,mint.publicKey,treasuryPda,true)
    const treasuryTokenBalance = (await program.provider.connection.getTokenAccountBalance(treasuryAta.address)).value.amount;
    const user1ATA = await getOrCreateAssociatedTokenAccount(program.provider.connection, initializer, mint.publicKey, initializer.publicKey);
    const user2ATA = await getOrCreateAssociatedTokenAccount(program.provider.connection, initializer2, mint.publicKey, initializer2.publicKey);
    const nftATA = await getOrCreateAssociatedTokenAccount(program.provider.connection, initializer, mint_nft.publicKey, initializer.publicKey);
    const treasuryWSOLATA=await getOrCreateAssociatedTokenAccount(program.provider.connection,initializer2,WSOL_ID,treasuryPda,true)
    // Consolidated logging with all previous metrics
    console.log("\n=== Protocol Statistics ===");
    console.log("Config Admin:", configAccounts.admin.toString());
    console.log("Transaction Fee Percentage:", configAccounts.feeBasisPoints/100 + "%");
    console.log("Subscription Price:", (configAccounts.subscriptionPrice.toNumber())/LAMPORTS_PER_SOL + " SOL");
    console.log("Subscription TX Allowance (fee-exempt):", configAccounts.subscriptionAllowance.toString());
    console.log("Treasury SOL Balance:", treasuryBalance/LAMPORTS_PER_SOL + " SOL");
    console.log("Treasury Token Balance:", treasuryTokenBalance);
    console.log("Treasury WSOL Balance:", (await program.provider.connection.getBalance(treasuryWSOLATA.address))/LAMPORTS_PER_SOL + " SOL");
    console.log("===========================\n");
    console.log("=== Subscriber Statistics ===");
    console.log("Name:", (await program.account.profile.fetch(profilePDA)).name.toString());
    console.log("Subscriber:", (await program.account.profile.fetch(profilePDA)).subscription.toString());
    console.log("Remaining Transactions (fee-exempt):", (await program.account.profile.fetch(profilePDA)).remainingTx.toString());
    console.log("Token Balance:", (await program.provider.connection.getTokenAccountBalance(user1ATA.address)).value.amount);
    console.log("NFT Balance:", (await program.provider.connection.getTokenAccountBalance(nftATA.address)).value.amount);
    console.log("Recipient SOL Balance:", (await program.provider.connection.getBalance(recipientS.publicKey))/LAMPORTS_PER_SOL + " SOL");
    console.log("Recipient Token Balance:", (await program.provider.connection.getTokenAccountBalance(recipientSAta.address)).value.amount);
    console.log("Recipient NFT Balance:", (await program.provider.connection.getTokenAccountBalance(recipientSNFT.address)).value.amount);
    console.log("===========================\n");
    console.log("=== Non-Subscriber Statistics ===");
    console.log("Name:", (await program.account.profile.fetch(profilePDA2)).name.toString());
    console.log("Subscriber:", (await program.account.profile.fetch(profilePDA2)).subscription.toString());
    console.log("Remaining Transactions (fee-exempt):", (await program.account.profile.fetch(profilePDA2)).remainingTx.toString());
    console.log("Token Balance:", (await program.provider.connection.getTokenAccountBalance(user2ATA.address)).value.amount);
    console.log("Recipient SOL Balance:", (await program.provider.connection.getBalance(recipientN.publicKey))/LAMPORTS_PER_SOL + " SOL");
    console.log("Recipient Token Balance:", (await program.provider.connection.getTokenAccountBalance(recipientNAta.address)).value.amount);
    console.log("===========================\n");
    console.log("=== Relevant Addresses ===");
    console.log("Token Contract Address:", mint.publicKey.toString());
    console.log("NFT Contract Address:", mint_nft.publicKey.toString());
    console.log("CPMM Pool Address:", pool_state.toString());
    console.log("CPMM Pool LP Mint Address:", lp_mint.toString());
    console.log("Kira Address:", initializer.publicKey.toString());
    console.log("Bob Address:", initializer2.publicKey.toString());
    console.log("Treasury Address:", treasuryPda.toString());
    console.log("Config Address:", configPda.toString());
    
  });

  it("User Profile Account Closed", async () => {
    const tx = await program.methods
      .close() 
      .accounts({
        user:profilePDA,
        initializer: initializer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer])
      .rpc();
      console.log("\nProfile Account Closed");
  });

});


