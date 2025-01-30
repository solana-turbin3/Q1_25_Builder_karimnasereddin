import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../wba-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("8hS7Hv2kA3igy9RFXXeyNrK9uup58oVmrNjUKcuvw7z6");

// Recipient address
const to = new PublicKey("CpEBx9kZRYyicMXqGJRc5pNdkDGa7mgGFKXgyUGJsocr");

(async () => {
    try {
        const fromTA = await getOrCreateAssociatedTokenAccount(connection,keypair,mint,keypair.publicKey);

        const toTA = await getOrCreateAssociatedTokenAccount(connection,keypair,mint,to);

        // Transfer the new token to the "toTokenAccount" we just created
        const signature= await transfer(connection,keypair,fromTA.address,toTA.address,keypair.publicKey,1337);
        console.log(`This is the transfer transaction: https://solscan.io/tx/${signature}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();