'use client'

import { getSagentProgram, getSagentProgramId } from '@project/anchor'
import { ConnectionProvider, useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY,TransactionInstruction, AddressLookupTableAccount, AddressLookupTableProgram, SetComputeUnitLimitParams, ComputeBudgetProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN } from '@coral-xyz/anchor'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, createSyncNativeInstruction, Account, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import * as web3 from '@solana/web3.js'
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Add NATIVE_MINT constant
const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112')


// Add all program constants from test file
const CPMM_PROGRAM_ID = new PublicKey('CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW')
const LOCK_CPMM_AUTHORITY_ID= new PublicKey('7AFUeLVRjBfzqK3tTGw8hN48KLQWSk6DTE8xprWdPqix')
const LOCK_CPMM_PROGRAM_ID = new PublicKey('DLockwT7X7sxtLmGH9g5kmfcjaBtncdbUmi738m5bvQC')
const AMM_CONFIG_ID = new PublicKey('9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6')
const CREATE_POOL_FEE = new PublicKey('G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2')

export function useSagentProgram() {
  const { connection } = useConnection()
  // const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSagentProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSagentProgram(provider, programId), [provider, programId])
  const configPda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    )
    return pda
  }, [program])

  const treasuryPda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      program.programId
    )
    return pda
  }, [program])

  const getConfig = useQuery({
    queryKey: ['sagent', 'config', { cluster }],
    queryFn: () => program.account.config.fetch(configPda),
  })

  const initializeProtocol = useMutation({
    mutationKey: ['sagent', 'initialize', { cluster }],
    mutationFn: (params: {
      admin: PublicKey
      feeBasisPoints: number
      subscriptionPrice: BN
      subscriptionAllowance: BN
    }) => program.methods
      .init(
        params.admin,
        params.feeBasisPoints,
        params.subscriptionPrice,
        params.subscriptionAllowance
      )
      .accounts({
        config: configPda,
        treasury: treasuryPda,
        admin: params.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return getConfig.refetch()
    },
    onError: () => toast.error('Failed to initialize protocol'),
  })

  return {
    program,
    programId,
    configPda,
    treasuryPda,
    getConfig,
    initializeProtocol,
    subscribe: useMutation({
      mutationKey: ['sagent', 'subscribe', { cluster }],
      mutationFn: (publicKey: PublicKey) => program.methods.subscribe()
        .accounts({
          user: profilePda,
          initializer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
      onSuccess: (tx) => {
        transactionToast(tx)
        return getConfig.refetch().then(() => {
          return tx
        })
      },
    }),
    sendSol: useMutation({
      mutationKey: ['sagent', 'sendSol', { cluster }],
      mutationFn: ({ amount, recipient }: { amount: BN, recipient: PublicKey }) => 
        program.methods.sendSol(amount)
          .accounts({
            user: publicKey,
            profile: profilePda,
            config: configPda,
            treasury: treasuryPda,
            recipient,
            systemProgram: SystemProgram.programId,
          })
          .rpc(),
      onSuccess: (tx) => {
        transactionToast(tx)
        return getConfig.refetch()
      },
    }),
  }
}

export function useSagentProfile({ publicKey }: { publicKey: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, configPda, treasuryPda } = useSagentProgram()


  const profilePda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("profile"),
        publicKey.toBuffer()
      ],
      program.programId
    )
    return pda
  }, [program, publicKey])

  const getProfile = useQuery({
    queryKey: ['sagent', 'profile', { cluster, publicKey }],
    queryFn: () => program.account.profile.fetch(profilePda),
    enabled: !!publicKey,
  })

  const createProfile = useMutation({
    mutationKey: ['sagent', 'create-profile', { cluster, publicKey }],
    mutationFn: (name: string) => program.methods
      .addUser(name)
      .accounts({
        config: configPda,
        user: profilePda,
        initializer: publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return getProfile.refetch()
    },
  })

  const swapTokens = useMutation({
    mutationKey: ['sagent', 'swap', { cluster, publicKey }],
    mutationFn: async (params: {
      amountIn: BN
      amountOutMin: BN
      inputTokenMint: PublicKey
      outputTokenMint: PublicKey
    }) => {
      let amountFinal=params.amountIn
      let poolStateMint: PublicKey;
      if(params.inputTokenMint.equals(NATIVE_MINT)){
        poolStateMint=params.outputTokenMint
      }else{
        poolStateMint=params.inputTokenMint
      }
      if (params.inputTokenMint.equals(NATIVE_MINT)) {
        amountFinal = params.amountIn.mul(new BN(LAMPORTS_PER_SOL));
        const inputTokenAccount = getAssociatedTokenAddressSync(NATIVE_MINT, publicKey);

        const wrapTransaction = new Transaction();
        if (!(await program.provider.connection.getAccountInfo(inputTokenAccount))) {
          wrapTransaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              inputTokenAccount,
              publicKey,
              NATIVE_MINT
            )
          );
        }
        wrapTransaction
          .add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: inputTokenAccount,
              lamports: amountFinal.toNumber(),
            }),
            createSyncNativeInstruction(inputTokenAccount)
          );
  
        await program.provider!.sendAndConfirm(wrapTransaction);
      }
      else{
        const result = await program.provider.connection.getParsedAccountInfo(params.inputTokenMint)
        const {decimals} = result?.value?.data?.parsed?.info || {};
        amountFinal = params.amountIn.mul(new BN(10 ** decimals));
      }
      // Derive necessary PDAs
      const [poolState] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool"),
          AMM_CONFIG_ID.toBuffer(),
          NATIVE_MINT.toBuffer(),
          poolStateMint.toBuffer(),
        ],
        CPMM_PROGRAM_ID
      );

      const [observationState] = PublicKey.findProgramAddressSync(
        [Buffer.from("observation"), poolState.toBuffer()],
        CPMM_PROGRAM_ID
      );

      const [tokenVault0] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolState.toBuffer(), params.inputTokenMint.toBuffer()],
        CPMM_PROGRAM_ID
      );

      const [tokenVault1] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolState.toBuffer(), params.outputTokenMint.toBuffer()],
        CPMM_PROGRAM_ID
      );

      const [authority] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_and_lp_mint_auth_seed")],
        CPMM_PROGRAM_ID
      );

      // Get ATAs
      const inputTokenAccount = getAssociatedTokenAddressSync(params.inputTokenMint, publicKey);
      const outputTokenAccount = getAssociatedTokenAddressSync(params.outputTokenMint, publicKey);
      const treasuryAta = getAssociatedTokenAddressSync(params.inputTokenMint, treasuryPda, true);

        const tAtaTransaction = new Transaction();
        if (!(await program.provider.connection.getAccountInfo(treasuryAta))) {
          tAtaTransaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              treasuryAta,
              treasuryPda, // owner (treasury PDA)
              params.inputTokenMint
            )
          );
        }
        
        await program.provider!.sendAndConfirm(tAtaTransaction);

      return program.methods
        .swap(amountFinal, params.amountOutMin)
        .accountsPartial({
          profile:profilePda,
          config:configPda,
          treasury:treasuryPda,
          treasuryAta:treasuryAta,
          cpSwapProgram: CPMM_PROGRAM_ID,
          creator: publicKey,
          authority: authority,
          ammConfig: AMM_CONFIG_ID,
          poolState: poolState,
          inputTokenAccount: inputTokenAccount,
          outputTokenAccount: outputTokenAccount,
          inputVault: tokenVault0,
          outputVault: tokenVault1,
          inputTokenProgram: TOKEN_PROGRAM_ID,
          outputTokenProgram: TOKEN_PROGRAM_ID,
          inputTokenMint: params.inputTokenMint,
          outputTokenMint: params.outputTokenMint,
          observationState: observationState,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return getProfile.refetch()
    },
  })

  const mintNft = useMutation({
    mutationKey: ['sagent', 'mint-nft', { cluster, publicKey }],
    mutationFn: (mint: PublicKey) => program.methods
      .mintNft()
      .accounts({
        config: configPda,
        profile: profilePda,
        user: publicKey,
        mint,
        tokenProgram:TOKEN_PROGRAM_ID,
        associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram:SystemProgram.programId,
      })
      .rpc(),
      onSuccess: (tx) => {
      transactionToast(tx)
      return getProfile.refetch()
    },
  })

  const subscribe = useMutation({
    mutationKey: ['sagent', 'subscribe', { cluster, publicKey }],
    mutationFn: () => program.methods.subscribe()
      .accounts({
        user: profilePda,
        initializer: publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return getProfile.refetch().then(() => {
        return tx
      })
    },
  })

  const createTokenMint = useMutation({
    mutationKey: ['sagent', 'create-token', { cluster, publicKey }],
    mutationFn: async (metadata: {
      name: string
      symbol: string
      uri: string
      decimals: number
    }) => {

      // Generate fresh keypairs every time
      const mintKeypair = Keypair.generate()
      const feeNftMintKeypair = Keypair.generate()

      // const [LOCK_CPMM_AUTHORITY_ID] = PublicKey.findProgramAddressSync(
      //   [Buffer.from("lock_cp_authority_seed")],
      //   LOCK_CPMM_PROGRAM_ID
      // )

      // Derive ALL PDAs fresh each time
      const [poolState] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool"),
          AMM_CONFIG_ID.toBuffer(),
          NATIVE_MINT.toBuffer(),
          mintKeypair.publicKey.toBuffer()
        ],
        CPMM_PROGRAM_ID
      )

      const [observationState] = PublicKey.findProgramAddressSync(
        [Buffer.from("observation"), poolState.toBuffer()],
        CPMM_PROGRAM_ID
      )

      const [tokenVault0] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolState.toBuffer(), NATIVE_MINT.toBuffer()],
        CPMM_PROGRAM_ID
      )

      const [tokenVault1] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolState.toBuffer(), mintKeypair.publicKey.toBuffer()],
        CPMM_PROGRAM_ID
      )

      const [authority] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_and_lp_mint_auth_seed")],
        CPMM_PROGRAM_ID
      )

      const [lpMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_lp_mint"), poolState.toBuffer()],
        CPMM_PROGRAM_ID
      )

      const [lockedLiquidity] = PublicKey.findProgramAddressSync(
        [Buffer.from("locked_liquidity"), feeNftMintKeypair.publicKey.toBuffer()],
        LOCK_CPMM_PROGRAM_ID
      )
      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Add these derivations before pool creation
      let creator_token_ata = getAssociatedTokenAddressSync(mintKeypair.publicKey, publicKey);

      let nft_mint_acc = getAssociatedTokenAddressSync(feeNftMintKeypair.publicKey, publicKey);
  
      let lp_mint_ata = getAssociatedTokenAddressSync(lpMint, publicKey);
  
      let locked_lp_vault = getAssociatedTokenAddressSync(lpMint, LOCK_CPMM_AUTHORITY_ID, true);
 
      // Create token mint with all test file accounts
      await program.methods.createMint(metadata)
        .accounts({
          profile:profilePda,
          config:configPda,
          treasury:treasuryPda,
          metadata: metadataAddress,
          mint:mintKeypair.publicKey,
          signer:publicKey,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([mintKeypair])
        .rpc()
        const slot = await program.provider.connection.getSlot();

      let [lookupTableInst, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
          authority: publicKey,
          payer: publicKey,
          recentSlot: slot,
        });

      const extendInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: publicKey,
        authority: publicKey,
        lookupTable: lookupTableAddress,
        addresses: [
          SystemProgram.programId,
          program.programId,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_METADATA_PROGRAM_ID,
          CPMM_PROGRAM_ID,
          SYSVAR_RENT_PUBKEY,
          CREATE_POOL_FEE,
          AMM_CONFIG_ID,
          NATIVE_MINT
          // list more publicKey addresses here
        ],
      });
      let lookupTableAccount = (
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
      const messageV0 = new web3.TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [lookupTableInst, extendInstruction]
      }).compileToV0Message([])

      // creating a versioned tx and using that to sendTransaction to avoid deprecation
      const transaction = new web3.VersionedTransaction(messageV0);

      transaction.sign;
      await program.provider!.sendAndConfirm(transaction);



      // LOOKUP TABLES DONE


      const creator_base_ata = getAssociatedTokenAddressSync(NATIVE_MINT, publicKey);

      const wrapTransaction = new Transaction();
      if (!(await program.provider.connection.getAccountInfo(creator_base_ata))) {
        wrapTransaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            creator_base_ata,
            publicKey,
            NATIVE_MINT
          )
        );
      }
      wrapTransaction
        .add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: creator_base_ata,
            lamports: 2 * LAMPORTS_PER_SOL,
          }),
          createSyncNativeInstruction(creator_base_ata)
        );

      await program.provider!.sendAndConfirm(wrapTransaction);

  
  

    const funding_amount=new BN(2*LAMPORTS_PER_SOL)
    const createCpmmPool = await program.methods
    .createCpmmPool(
      funding_amount
  )
    .accountsPartial({
      cpSwapProgram: CPMM_PROGRAM_ID,
      creator: publicKey,
      ammConfig: AMM_CONFIG_ID,
      authority: authority,
      poolState: poolState,
      baseMint: NATIVE_MINT,
      tokenMint: mintKeypair.publicKey,
      lpMint: lpMint,
      creatorBaseAta: creator_base_ata,
      creatorTokenAta: creator_token_ata,
      creatorLpToken: lp_mint_ata,
      token0Vault: tokenVault0,
      token1Vault: tokenVault1,
      createPoolFee: CREATE_POOL_FEE,
      observationState: observationState,
      tokenProgram: TOKEN_PROGRAM_ID,
      token1Program: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY

    })
    .signers([ mintKeypair])
    .instruction()

    const lockCpiIx = await program.methods
    .lockCpmmLiquidity(
  )
    .accountsPartial({
      cpSwapProgram: CPMM_PROGRAM_ID,
      lockCpmmProgram: LOCK_CPMM_PROGRAM_ID,
      creator: publicKey,
      ammConfig: AMM_CONFIG_ID,
      authority: LOCK_CPMM_AUTHORITY_ID,
      feeNftMint: feeNftMintKeypair.publicKey,
      feeNftAcc: nft_mint_acc,
      poolState: poolState,
      lockedLiquidity: lockedLiquidity,
      lpMint: lpMint,
      liquidityOwnerLp: lp_mint_ata,
      lockedLpVault: locked_lp_vault,
      token0Vault: tokenVault0,
      token1Vault: tokenVault1,
      metadata: metadataAddress,
      metadataProgram: TOKEN_METADATA_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      baseMint: NATIVE_MINT,
      tokenMint: mintKeypair.publicKey

    })
    .signers([feeNftMintKeypair]) // Signer of the transaction
    .instruction()


    let blockhash2 = await program.provider.connection
    .getLatestBlockhash()
    .then(res => res.blockhash);

  const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 } as SetComputeUnitLimitParams);

  lookupTableAccount = (
    await program.provider.connection.getAddressLookupTable(lookupTableAddress)
  ).value;

  // creating a versioned message instead of leagacy
  const messageV02 = new web3.TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash2,
    instructions: [setComputeUnitLimitIx, createCpmmPool, lockCpiIx]
  }).compileToV0Message([lookupTableAccount])

  // creating a versioned tx and using that to sendTransaction to avoid deprecation

  const transaction2 = new web3.VersionedTransaction(messageV02);

  transaction2.sign([mintKeypair, feeNftMintKeypair]);
  
  // Send with fresh confirmation
  const tx = await program.provider!.sendAndConfirm(transaction2, [mintKeypair, feeNftMintKeypair]);
  return { tx, mint: mintKeypair.publicKey };
    },
    onSuccess: ({ tx, mint }) => {
      toast.success(`Token mint: ${mint.toString()}`);
      return getProfile.refetch();
    },
    onError: (error) => { // Add error handling
      console.error('Create Token Error:', error)
      toast.error(`Failed to create token: ${error.message}`)
    }
  })

  const createNftMint = useMutation({
    mutationKey: ['sagent', 'create-nft', { cluster, publicKey }],
    mutationFn: async (metadata: {
      name: string
      symbol: string
      uri: string
      decimals: number
    }) => {
      const mintKeypair = Keypair.generate()
      
      // Create combined transaction
      const createIx = await program.methods.createNft(metadata)
        .accounts({
          metadata: PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )[0],
          mint: mintKeypair.publicKey,
          signer: publicKey,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .instruction()

      // Build and send combined transaction
      const tx = new web3.Transaction().add(createIx)
      return await program.provider!.sendAndConfirm(tx, [mintKeypair])
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return getProfile.refetch()
    },
  })

  return {
    profilePda,
    getProfile,
    createProfile,
    subscribe,
    sendSol: useMutation({
      mutationKey: ['sagent', 'sendSol', { cluster, publicKey }],
      mutationFn: ({ amount, recipient }: { amount: BN; recipient: PublicKey }) => 
        program.methods.sendSol(amount)
          .accounts({
            user: publicKey,
            profile: profilePda,
            config: configPda,
            treasury: treasuryPda,
            recipient,
            systemProgram: SystemProgram.programId,
          })
          .rpc(),
      onSuccess: (tx) => {
        transactionToast(tx)
        return getProfile.refetch()
      },
    }),
    sendToken: useMutation({
      mutationKey: ['sagent', 'sendToken', { cluster, publicKey }],
      mutationFn: async ({ amount, recipient, mint }: { 
        amount: number; 
        recipient: PublicKey;
        mint: PublicKey 
      }) => {
        const result = await program.provider.connection.getParsedAccountInfo(mint)
        const {decimals} = result?.value?.data?.parsed?.info || {};
        const amountBN = new BN(amount * 10 ** decimals);
        const treasuryAta = getAssociatedTokenAddressSync(
          mint, 
          treasuryPda,
          true
        );

        const tAtaTransaction = new Transaction();
        if (!(await program.provider.connection.getAccountInfo(treasuryAta))) {
          tAtaTransaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              treasuryAta,
              treasuryPda, // owner (treasury PDA)
              mint
            )
          );
        }
        
        await program.provider!.sendAndConfirm(tAtaTransaction);

        return program.methods.sendToken(amountBN)
          .accountsPartial({
            user: publicKey,
            recipient,
            mint,
            profile: profilePda,
            config: configPda,
            treasury: treasuryPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      },
      onSuccess: (tx) => {
        transactionToast(tx)
        return getProfile.refetch()
      },
    }),
    sendNft: useMutation({
      mutationKey: ['sagent', 'sendNft', { cluster, publicKey }],
      mutationFn: ({ recipient, mint }: { 
        recipient: PublicKey;
        mint: PublicKey 
      }) => program.methods.sendNft()
        .accounts({
          user: publicKey,
          recipient,
          mint,
          profile: profilePda,
          config: configPda,
          treasury: treasuryPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
      onSuccess: (tx) => {
        transactionToast(tx)
        return getProfile.refetch()
      },
    }),
    mintNft,
    swapTokens,
    createTokenMint,
    createNftMint,
  }
}

