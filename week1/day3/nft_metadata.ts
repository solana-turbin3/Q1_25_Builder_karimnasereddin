import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://devnet.irys.xyz/JC9vDeSEZmqbytLFEdFBMn8tVi1uybGV3vGQYZLBuw6w"
        const metadata = {
            name: "RuggyRug",
            symbol: "RR",
            description: "The rugs of all rugs",
            image: image,
            attributes: [
                {trait_type: 'rare', value: '1'}
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "https://devnet.irys.xyz/JC9vDeSEZmqbytLFEdFBMn8tVi1uybGV3vGQYZLBuw6w"
                    },
                ]
            },
            creators: []
        };
        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Your metadata URI: ", myUri.replace("https://arweave.net", "https://devnet.irys.xyz")); //fixed it again
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
