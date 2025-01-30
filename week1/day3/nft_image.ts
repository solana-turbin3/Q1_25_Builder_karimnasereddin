import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');
const image_path= "./generug.png"
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        const image = await readFile(image_path);
        //2. Convert image to generic file.
        const generic = createGenericFile(image,"generug.png",
            {
                displayName:"Rare Rug",
                contentType:"image/png"
            });
        //3. Upload image
         const [myUri] = await umi.uploader.upload([generic]);
         console.log("Your image URI: ", myUri.replace("https://arweave.net", "https://devnet.irys.xyz")); // fixed the link :)
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
