'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useSagentProgram, useSagentProfile } from './sagent-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function SagentCreate() {
  const { initializeProtocol } = useSagentProgram()
  const { publicKey } = useWallet()
  const { program, configPda } = useSagentProgram()
  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        initializeProtocol.mutateAsync({
          admin: publicKey!,
          feeBasisPoints: 100,
          subscriptionPrice: new BN(1_000_000_000),
          subscriptionAllowance: new BN(100)
        })
      }
      disabled={!publicKey || initializeProtocol.isPending}
    >
      Initialize Protocol {initializeProtocol.isPending && '...'}
    </button>
  )
}

export function SagentList() {
  const { getConfig, configPda, treasuryPda } = useSagentProgram()
  const { publicKey } = useWallet()

  if (getConfig.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  return (
    <div className="space-y-6">
      {!getConfig.data ? (
        <div className="alert alert-warning text-center">
          Protocol not initialized yet
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Protocol Configuration</h2>
              <div className="space-y-2">
                <p>Admin: {ellipsify(getConfig.data.admin.toString())}</p>
                <p>Fee: {getConfig.data.feeBasisPoints / 100}%</p>
                <p>Subscription Price: {getConfig.data.subscriptionPrice.toNumber() / 1e9} SOL</p>
                <p>Free Transactions: {getConfig.data.subscriptionAllowance.toString()}</p>
              </div>
              <div className="mt-4">
                <ExplorerLink path={`account/${configPda}`} label="View Config" />
                <ExplorerLink path={`account/${treasuryPda}`} label="View Treasury" className="ml-2" />
              </div>
            </div>
          </div>

          {publicKey && <UserProfileCard publicKey={publicKey} />}
        </div>
      )}
    </div>
  )
}

function UserProfileCard({ publicKey }: { publicKey: PublicKey }) {
  const { 
    getProfile, 
    createProfile, 
    subscribe,
    sendSol,
    sendToken,
    sendNft,
    mintNft,
    profilePda,
    createTokenMint,
    createNftMint,
  } = useSagentProfile({ publicKey })
  const [sendAmount, setSendAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [tokenRecipient, setTokenRecipient] = useState('')
  const [tokenMint, setTokenMint] = useState('')
  const [nftRecipient, setNftRecipient] = useState('')
  const [nftName, setNftName] = useState('')
  const [nftSymbol, setNftSymbol] = useState('')
  const [nftUri, setNftUri] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenUri, setTokenUri] = useState('')

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Your Profile</h2>
        
        {getProfile.isLoading ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : getProfile.data ? (
          <div className="space-y-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Name</div>
                <div className="stat-value text-lg">{getProfile.data.name}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Subscribed</div>
                <div className="stat-value text-lg">
                  {getProfile.data.subscription ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Free TXs Left</div>
                <div className="stat-value text-lg">
                  {getProfile.data.remainingTx.toString()}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-primary"
                onClick={() => subscribe.mutateAsync(publicKey)}
                disabled={subscribe.isPending}
              >
                Subscribe {subscribe.isPending && '...'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => sendSol.mutateAsync({
                  amount: new BN(parseFloat(sendAmount) * LAMPORTS_PER_SOL),
                  recipient: new PublicKey(recipient)
                })}
                disabled={sendSol.isPending}
              >
                Send SOL {sendSol.isPending && '...'}
              </button>

              <ExplorerLink 
                path={`account/${profilePda}`} 
                label="View Profile" 
                className="btn btn-outline"
              />
            </div>

            <div className="flex flex-col gap-2">
              {!getProfile.data.subscription && (
                <button
                  className="btn btn-accent"
                  onClick={() => subscribe.mutateAsync(publicKey)}
                  disabled={subscribe.isPending}
                >
                  Subscribe {subscribe.isPending && '...'}
                </button>
              )}
              
              <div className="form-control">
                <label className="label">Send SOL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Amount (SOL)"
                    className="input input-bordered"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Recipient Address"
                    className="input input-bordered flex-grow"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => sendSol.mutateAsync({
                      amount: new BN(parseFloat(sendAmount) * LAMPORTS_PER_SOL),
                      recipient: new PublicKey(recipient)
                    })}
                    disabled={sendSol.isPending}
                  >
                    Send SOL {sendSol.isPending && '...'}
                  </button>
                </div>
              </div>
            </div>

            {/* Token Transfer Section */}
            <div className="form-control">
              <label className="label">Send Tokens</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Token Mint Address"
                  className="input input-bordered"
                  value={tokenMint}
                  onChange={(e) => setTokenMint(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="input input-bordered"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Recipient Address"
                  className="input input-bordered flex-grow"
                  value={tokenRecipient}
                  onChange={(e) => setTokenRecipient(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => sendToken.mutateAsync({
                    amount: new BN(tokenAmount),
                    recipient: new PublicKey(tokenRecipient),
                    mint: new PublicKey(tokenMint)
                  })}
                  disabled={sendToken.isPending}
                >
                  Send Tokens {sendToken.isPending && '...'}
                </button>
              </div>
            </div>

            {/* NFT Transfer Section */}
            <div className="form-control">
              <label className="label">Send NFT</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="NFT Mint Address"
                  className="input input-bordered"
                  value={nftRecipient}
                  onChange={(e) => setNftRecipient(e.target.value)}
                />
            <button
                  className="btn btn-secondary"
                  onClick={() => sendNft.mutateAsync({
                    recipient: new PublicKey(nftRecipient),
                    mint: new PublicKey(nftRecipient)
                  })}
                  disabled={sendNft.isPending}
                >
                  Send NFT {sendNft.isPending && '...'}
            </button>
              </div>
            </div>

            {/* Token Creation Section */}
            <div className="form-control">
              <label className="label">Create Token</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Token Name"
                  className="input input-bordered"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Token Symbol"
                  className="input input-bordered"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Token URI"
                  className="input input-bordered"
                  value={tokenUri}
                  onChange={(e) => setTokenUri(e.target.value)}
                />
            <button
                  className="btn btn-primary"
                  onClick={() => createTokenMint.mutateAsync({
                    name: tokenName,
                    symbol: tokenSymbol,
                    uri: tokenUri,
                    decimals: 6
                  })}
                  disabled={createTokenMint.isPending}
                >
                  Create Token {createTokenMint.isPending && '...'}
            </button>
              </div>
            </div>

            {/* NFT Creation Section */}
            <div className="form-control">
              <label className="label">Create NFT Collection</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Collection Name"
                  className="input input-bordered"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Collection Symbol"
                  className="input input-bordered"
                  value={nftSymbol}
                  onChange={(e) => setNftSymbol(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Metadata URI"
                  className="input input-bordered"
                  value={nftUri}
                  onChange={(e) => setNftUri(e.target.value)}
                />
            <button
                  className="btn btn-accent"
                  onClick={() => {
                    createNftMint.mutateAsync({
                      name: nftName,
                      symbol: nftSymbol,
                      uri: nftUri,
                      decimals: 0
                    }).then(() => {
                      setNftName(''); 
                      setNftSymbol(''); 
                      setNftUri('');
                    })
                  }}
                  disabled={createNftMint.isPending}
                >
                  {createNftMint.isPending ? 'Creating Collection...' : 'Create NFT Collection'}
            </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <input
              type="text"
              placeholder="Enter your name"
              className="input input-bordered w-full max-w-xs mb-4"
              id="profileName"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                const name = (document.getElementById('profileName') as HTMLInputElement)?.value
                if (name) createProfile.mutateAsync(name)
              }}
              disabled={createProfile.isPending}
            >
              Create Profile {createProfile.isPending && '...'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
