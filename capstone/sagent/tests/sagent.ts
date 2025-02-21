import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Sagent } from "../target/types/sagent";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair, Account, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, mintTo,transferChecked, memoTransferInstructionData } from "@solana/spl-token";

describe("sagent", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Sagent as Program<Sagent>;
  const initializer = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const initializer2 = anchor.web3.Keypair.generate();
  const mint = anchor.web3.Keypair.generate();
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

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
        new BN(1_000_000_000),
        new BN(100)
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
    console.log("Config admin is: ",configAccounts.admin.toString(),"and fee per non-sub transaction is: ",configAccounts.feeBasisPoints/100,"%");
  });
  it("Create User profile", async () => {
    
    const name = "Kira";


    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer.publicKey,
      3.5*LAMPORTS_PER_SOL // 2SOL
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
  });
  it("User has Subscribed", async () => {


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

  });
  it("Create Second User profile", async () => {
    
    const name = "Bob";

    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer2.publicKey,
      1.5*LAMPORTS_PER_SOL // 2SOL
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

  });
  it("Subscriber invokes Send Sol function to recipient", async () => {
    const tres1_balance=await program.provider.connection.getBalance(treasuryPda)
    console.log("Treasury Balance is (before subscriber transaction): ",tres1_balance/LAMPORTS_PER_SOL+" SOL");
    const recipient = anchor.web3.Keypair.generate();
    const amount = new BN(1 * LAMPORTS_PER_SOL);
    const tx = await program.methods.sendSol(amount)
    .accounts({
      user:initializer.publicKey,
      profile:profilePDA,
      config:configPda,
      treasury:treasuryPda,
      recipient:recipient.publicKey,
      systemProgram:SystemProgram.programId,
  }).signers([initializer])
  .rpc();
  const balance=await program.provider.connection.getBalance(recipient.publicKey)
  console.log("Recipient Balance is: ",balance/LAMPORTS_PER_SOL+" SOL");
  const tres2_balance=await program.provider.connection.getBalance(treasuryPda)
  console.log("Treasury Balance is (after subscriber transaction) (should remain same as is fee-exempted): ",tres2_balance/LAMPORTS_PER_SOL+" SOL");
});
it("Non-Subscriber invokes Send Sol function to recipient", async () => {
  const tres1_balance=await program.provider.connection.getBalance(treasuryPda)
  console.log("Treasury Balance is (before non-subscriber transaction): ",tres1_balance/LAMPORTS_PER_SOL+" SOL");
  const recipient = anchor.web3.Keypair.generate();
  const amount = new BN(1 * LAMPORTS_PER_SOL);
  const tx = await program.methods.sendSol(amount)
  .accounts({
    user:initializer2.publicKey,
    profile:profilePDA2,
    config:configPda,
    treasury:treasuryPda,
    recipient:recipient.publicKey,
    systemProgram:SystemProgram.programId,
}).signers([initializer2])
.rpc();
const balance=await program.provider.connection.getBalance(recipient.publicKey)
console.log("Recipient Balance is: ",balance/LAMPORTS_PER_SOL+" SOL");
const tres2_balance=await program.provider.connection.getBalance(treasuryPda)
const configAccounts=await program.account.config.fetch(configPda)
console.log("Treasury Balance is (after non-subscriber transaction)(should deduct",configAccounts.feeBasisPoints/100,"% fee): ",tres2_balance/LAMPORTS_PER_SOL+" SOL");
});

it("Check Treasury Balance", async () => {
    const balance=await program.provider.connection.getBalance(treasuryPda)
    console.log("Treasury Balance is: ",balance/LAMPORTS_PER_SOL+" SOL");
});
  it("Admin withdraw from treasury to recipient", async () => {
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

    const balance = await program.provider.connection.getBalance(recipient.publicKey);
    console.log("Recipient balance:", balance / LAMPORTS_PER_SOL, "SOL");
    const tresbalance=await program.provider.connection.getBalance(treasuryPda)
    console.log("Treasury Balance is:",tresbalance/LAMPORTS_PER_SOL+" SOL");
  });
  it("Malicious admin cannot withdraw funds", async () => {
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
      console.log("Error Code: Unauthorized Error Code is returned as expected.")
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
      metadata: metadataAddress,
      mint:mint.publicKey,
      signer:initializer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([initializer,mint])
    .rpc();

    console.log("Token Mint Created:", mint.publicKey.toBase58());
  });

  it("Mint Token to subscriber", async () => {
    let user_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      initializer.publicKey,
    );
    let user2_ata=await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer2,
      mint.publicKey,
      initializer2.publicKey,
    );
    const treasuryAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      initializer,
      mint.publicKey,
      treasuryPda,
      true,
    );
    let amount=new BN(2000);

    const tx = await program.methods.mintToken(amount)
    .accountsPartial({
      user:initializer.publicKey,
      mint:mint.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer])
    .rpc();
    const user_balance=await program.provider.connection.getTokenAccountBalance(user_ata.address)
    console.log("Subscriber token balance is:",user_balance.value.amount);
  });


  it("Subscriber sends tokens without fee", async () => {
    const amount = new BN(500); // 500 tokens with decimals
    
    const recipient = anchor.web3.Keypair.generate();
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
      recipient.publicKey,
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
      user:initializer.publicKey,
      recipient:recipient.publicKey,
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
    const tx2 = await program.methods.sendToken(amount)
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
    let recipient_balance=(await program.provider.connection.getTokenAccountBalance(recipientAta.address)).value.amount
    console.log("Recipient Token balance is:",recipient_balance);
    let treasury_balance=(await program.provider.connection.getTokenAccountBalance(treasuryAta.address)).value.amount
    console.log("Treasury Token balance is(no fee deducted):",treasury_balance);
  });

  it("Non-subscriber sends tokens with fee", async () => {
    const amount = new BN(500); // 500 tokens with decimals
    
    const recipient = anchor.web3.Keypair.generate();
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
      recipient.publicKey,
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
      recipient:recipient.publicKey,
      mint:mint.publicKey,
      treasury:treasuryPda,
      config:configPda,
      tokenProgram:TOKEN_PROGRAM_ID,
      associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:SystemProgram.programId,
    })
    .signers([initializer2])
    .rpc();
    let recipient_balance=(await program.provider.connection.getTokenAccountBalance(recipientAta.address)).value.amount
    console.log("Recipient Token balance is:",recipient_balance);
    let treasury_balance=(await program.provider.connection.getTokenAccountBalance(treasuryAta.address)).value.amount
    console.log("Treasury Token balance is(+fee deducted):",treasury_balance);
  });
  it("Checking remaining tx for subscriber", async () => {
    const profileAccount=await program.account.profile.fetch(profilePDA)
    console.log("Remaining Transactions for",(profileAccount.name).toString(),"are: ",(profileAccount.remainingTx).toString());
  
  });
  it("User Profile Account Closed", async () => {
    // Execute the transaction
    const tx = await program.methods
      .close() 
      .accounts({
        user:profilePDA,
        initializer: initializer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer])
      .rpc();

    console.log("Account Closed signature:", tx);
  });
  it("Pause to inspect", (done) => {
    setTimeout(() => done(), 999_000);
  }).timeout(999_000);
});


