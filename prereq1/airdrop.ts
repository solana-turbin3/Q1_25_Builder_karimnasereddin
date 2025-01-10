import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import wallet from "./dev-wallet.json"
import { constrainedMemory } from "process";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

(async()=>{
    try{
        const txhash= await connection.requestAirdrop(keypair.publicKey,2*LAMPORTS_PER_SOL);
        console.log(`Succesful Transaction, Click the explorer link to check it out: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    }
    catch(e){
        console.log('Something went terribly wrong buddy: ',e);
    }
})();



