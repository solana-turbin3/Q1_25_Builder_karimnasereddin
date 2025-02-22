import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Sagent } from "../target/types/sagent";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

describe("sagent", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Sagent as Program<Sagent>;
  const initializer = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const initializer2 = anchor.web3.Keypair.generate();
  const mint = anchor.web3.Keypair.generate();
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
    
  });
  it("Create User profile (Kira)", async () => {
    
    const name = "Kira";


    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer.publicKey,
      2.5*LAMPORTS_PER_SOL // 2SOL
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
      2*LAMPORTS_PER_SOL // 2SOL
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

    // Consolidated logging with all previous metrics
    console.log("\n=== Protocol Statistics ===");
    console.log("Config Admin:", configAccounts.admin.toString());
    console.log("Transaction Fee Percentage:", configAccounts.feeBasisPoints/100 + "%");
    console.log("Treasury SOL Balance:", treasuryBalance/LAMPORTS_PER_SOL + " SOL");
    console.log("Treasury Token Balance:", treasuryTokenBalance);
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
    console.log("Token Contract Address:", mint.publicKey.toString());
    console.log("NFT Contract Address:", mint_nft.publicKey.toString());
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
  // it("Pause to inspect", (done) => {
  //   setTimeout(() => done(), 999_000);
  // }).timeout(999_000);
});


