import {Keypair} from "@solana/web3.js";


let kp=Keypair.generate();
console.log(`Wallet generated: ${kp.publicKey.toBase58()}`);
console.log(`Your secret key:\n[${kp.secretKey}]`);