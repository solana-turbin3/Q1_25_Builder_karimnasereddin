import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Sagent } from "../target/types/sagent";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("sagent", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Sagent as Program<Sagent>;
  const initializer = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
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
  it("Initialize Sagent Protocol and Config", async () => {
    
    // Funding the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      admin.publicKey,
      1e9+10000
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

    console.log("Transaction signature:", tx);
    const configAccounts=await program.account.config.fetch(configPda)
    console.log("Config admin is: ",configAccounts.admin.toString());
  });
  it("Create User profile", async () => {
    
    const name = "Kira";


    // Fund the initializer
    const initializerAirdrop = await program.provider.connection.requestAirdrop(
      initializer.publicKey,
      1e9+10000 // 1 SOL
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

    console.log("Transaction signature:", tx);
  });
  it("Subscribed", async () => {


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

    console.log("Transaction signature:", tx);
  });
  it("Checking remaining tx", async () => {
    const profileAccount=await program.account.profile.fetch(profilePDA)
    console.log("Remaining Transactions are: ",profileAccount.remainingTx.toString());

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

    console.log("Transaction signature:", tx);
  });

});