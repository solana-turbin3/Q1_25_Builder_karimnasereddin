// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import SagentIDL from '../target/idl/sagent.json'
import type { Sagent } from '../target/types/sagent'
import { BN } from 'bn.js'

// Re-export the generated IDL and type
export { Sagent, SagentIDL }

// The programId is imported from the program IDL.
export const SAGENT_PROGRAM_ID = new PublicKey(SagentIDL.address)

// This is a helper function to get the Test Anchor program.
export function getSagentProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...SagentIDL, address: address ? address.toBase58() : SagentIDL.address } as Sagent, provider)
}

// This is a helper function to get the program ID for the Test program depending on the cluster.
export function getSagentProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Test program on devnet and testnet.
      return new PublicKey('SAGEfgw3ncJAvhqBadJ8B377AvPEJ5wGw6jtgGKFueG')
    case 'mainnet-beta':
    default:
      return SAGENT_PROGRAM_ID
  }
}
