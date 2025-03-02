'use client'

import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useSagentProgram, useSagentProfile } from './sagent-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useChat } from 'ai/react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SagentCreate() {
  const { initializeProtocol } = useSagentProgram()
  const { publicKey } = useWallet()
  const { program, configPda } = useSagentProgram()
  return (
    <button
      className="btn "
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
        <div className="grid gap-4 p-4">
          <div className="card bg-base-200 text-center">
            <div className="card-body text-center">
              <h4 className="text-center text-2xl text-slate-300">Protocol Configuration</h4>
              <br></br>
              <div className="space-y-2">
                <p>Admin: {ellipsify(getConfig.data.admin.toString())}</p>
                <p>Fee: {getConfig.data.feeBasisPoints / 100}%</p>
                <p>Subscription Price: {getConfig.data.subscriptionPrice.toNumber() / 1e9} SOL</p>
                <p>Free Transactions: {getConfig.data.subscriptionAllowance.toString()}</p>
                <ExplorerLink path={`account/${configPda}`} label="Config" className="btn" />
                <ExplorerLink path={`account/${treasuryPda}`} label="Treasury" className="btn" />
              </div>
              <div className="mt-4">

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
    swapTokens,
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
  const [swapAmountIn, setSwapAmountIn] = useState('')
  const [swapAmountOutMin, setSwapAmountOutMin] = useState('')
  const [inputTokenMint, setInputTokenMint] = useState('')
  const [outputTokenMint, setOutputTokenMint] = useState('')
  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/chat', // You'll need to create this API route
  });
  const chatParent = useRef(null);
  const processedIds = useRef(new Set<string>());
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || processedIds.current.has(lastMessage.id) || isLoading) return;
    
    switch(true) {

      // SUBSCRIBE CASE
        case (
            lastMessage.role === 'assistant' && 
            lastMessage.content.startsWith('SUBSCRIBE') &&
            !subscribe.isPending
        ):
            processedIds.current.add(lastMessage.id);
            console.log('Valid subscription trigger');
            subscribe.mutateAsync().then((tx) => {
                console.log('Transaction ID:', tx);
                append({
                    id: Date.now().toString(),
                    content: `Transaction Confirmed!`,
                    role: 'system'
                });
            });
            break;

      // SEND SOL CASE
        case(
          lastMessage.role === 'assistant' && 
          lastMessage.content.startsWith('SEND SOL') &&
          !sendSol.isPending
        ):
          processedIds.current.add(lastMessage.id);
          const sendSolParams = lastMessage.content.split(':').map(p => p.trim());
          if (sendSolParams.length < 3) {
              console.error('Invalid SEND SOL format');
              break;
          }
          const amount = sendSolParams[1];
          console.log('Amount:', amount);
          const recipient = sendSolParams[2];
          console.log('Recipient:', recipient);
          sendSol.mutateAsync({
            amount: new BN(parseFloat(amount)*LAMPORTS_PER_SOL),
            recipient: new PublicKey(recipient)
          }).then((tx) => {
              console.log('Transaction ID:', tx);
              append({
                  id: Date.now().toString(),
                  content: `Transaction Confirmed!`,
                  role: 'system' 
              });
          });
          break;

      // SEND TOKEN CASE
          case(
            lastMessage.role === 'assistant' && 
            lastMessage.content.startsWith('SEND TOKEN') &&
            !sendToken.isPending
          ):
            processedIds.current.add(lastMessage.id);
            const sendTokenParams = lastMessage.content.split(':').map(p => p.trim());
            if (sendTokenParams.length < 3) {
                console.error('Invalid SEND TOKEN format');
                break;
            }
            const tokenSendAmount =  sendTokenParams[1];
            console.log('Amount:', tokenSendAmount);
            const tokenRecipient = sendTokenParams[2];
            console.log('Recipient:', tokenRecipient);
            const tokenMint = sendTokenParams[3];
            sendToken.mutateAsync({
              amount: parseFloat(tokenSendAmount),
              recipient: new PublicKey(tokenRecipient),
              mint: new PublicKey(tokenMint)
            }).then((tx) => {
                console.log('Transaction ID:', tx);
                append({
                    id: Date.now().toString(),
                    content: `Transaction Confirmed!`,
                    role: 'system' 
                });
            });
            break;

      // CREATE TOKEN MINT CASE
        case(
          lastMessage.role === 'assistant' && 
          lastMessage.content.startsWith('CREATE TOKEN MINT') &&
          !createTokenMint.isPending
        ):
            processedIds.current.add(lastMessage.id);
            const createTokenMintParams = lastMessage.content.split(':').map(p => p.trim());
            if (createTokenMintParams.length < 4) {
                console.error('Invalid CREATE TOKEN MINT format');
                break;
            }
            const tokenName = createTokenMintParams[1];
            const tokenSymbol = createTokenMintParams[2];
            const tokenUri = createTokenMintParams[3];
            createTokenMint.mutateAsync({
              name: tokenName,
              symbol: tokenSymbol,
              uri: tokenUri,
              decimals: 6
            }).then((tx) => {
              console.log('Transaction ID:', tx);
              append({
                id: Date.now().toString(),
                content: `Transaction Confirmed!`,
                role: 'system' 
              });
            });
            break;

      // CREATE NFT MINT CASE
        case(
          lastMessage.role === 'assistant' && 
          lastMessage.content.startsWith('CREATE NFT MINT') &&
          !createNftMint.isPending
        ):
            processedIds.current.add(lastMessage.id);
            const createNftMintParams = lastMessage.content.split(':').map(p => p.trim());
            if (createNftMintParams.length < 4) {
                console.error('Invalid CREATE NFT MINT format');
                break;
            }
            const nftName = createNftMintParams[1];
            const nftSymbol = createNftMintParams[2];
            const nftUri = createNftMintParams[3];
            createNftMint.mutateAsync({
              name: nftName,
              symbol: nftSymbol,
              uri: nftUri,
              decimals: 0
            }).then((tx) => {
              console.log('Transaction ID:', tx);
              append({
                id: Date.now().toString(),
                content: `Transaction Confirmed!`,
                role: 'system' 
              });
            });
            break;

      // SWAP TOKENS CASE
        case(
          lastMessage.role === 'assistant' && 
          lastMessage.content.startsWith('SWAP TOKENS') &&
          !swapTokens.isPending
        ):
            processedIds.current.add(lastMessage.id);
            const swapTokensParams = lastMessage.content.split(':').map(p => p.trim());
            if (swapTokensParams.length < 4) {
                console.error('Invalid SWAP TOKENS format');
                break;
            }
            const swapAmountIn = swapTokensParams[1];
            const inputTokenMint = swapTokensParams[2];
            const outputTokenMint = swapTokensParams[3];
            swapTokens.mutateAsync({
              amountIn: new BN(parseFloat(swapAmountIn)),
              amountOutMin: new BN( (0)),
              inputTokenMint: new PublicKey(inputTokenMint),
              outputTokenMint: new PublicKey(outputTokenMint)
            }).then((tx) => {
              console.log('Transaction ID:', tx);
              append({
                id: Date.now().toString(),
                content: `Transaction Confirmed!`,
                role: 'system' 
              });
            });
            break;
            default:
            // No action needed for other cases
    }
}, [messages, subscribe.isPending, sendSol.isPending, sendToken.isPending, append, isLoading, createTokenMint.isPending, createNftMint.isPending, swapTokens.isPending, sendNft.isPending]);



  return (
    <div className="card bg-base-200">
        
      <div className="card-body">
        <br></br>
        
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

            {/* <div className="flex gap-2 flex-wrap">
              <button
                className="btn "
                onClick={() => subscribe.mutateAsync(publicKey)}
                disabled={subscribe.isPending}
              >
                Subscribe {subscribe.isPending && '...'}
              </button>

              <button
                className="btn "
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
                className="btn "
              />
            </div> */}

            <div className="flex flex-col gap-2">
              <br></br>
              {!getProfile.data.subscription && (
                <button
                  className="btn"
                  onClick={() => subscribe.mutateAsync()}
                  disabled={subscribe.isPending}
                >
                  Subscribe {subscribe.isPending && '...'}
                </button>
              )}
              {/* Send SOL Section */}
              {/* <div className="form-control">
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
                    className="btn"
                    onClick={() => sendSol.mutateAsync({
                      amount: new BN(parseFloat(sendAmount) * LAMPORTS_PER_SOL),
                      recipient: new PublicKey(recipient)
                    })}
                    disabled={sendSol.isPending}
                  >
                    Send SOL {sendSol.isPending && '...'}
                  </button>
                </div>
              </div> */}
            </div>

            {/* Token Transfer Section */}
            {/* <div className="form-control">
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
                  className="btn "
                  onClick={() => sendToken.mutateAsync({
                    amount: parseFloat(tokenAmount),
                    recipient: new PublicKey(tokenRecipient),
                    mint: new PublicKey(tokenMint)
                  })}
                  disabled={sendToken.isPending}
                >
                  Send Tokens {sendToken.isPending && '...'}
                </button>
              </div>
            </div> */}

            {/* Swap Tokens Section */}
            {/* <div className="form-control">
              <label className="label">Swap Tokens</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Input Token Mint"
                  className="input input-bordered"
                  value={inputTokenMint}
                  onChange={(e) => setInputTokenMint(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Output Token Mint"
                  className="input input-bordered"
                  value={outputTokenMint}
                  onChange={(e) => setOutputTokenMint(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount In"
                  className="input input-bordered"
                  value={swapAmountIn}
                  onChange={(e) => setSwapAmountIn(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Min Amount Out"
                  className="input input-bordered"
                  value={swapAmountOutMin}
                  onChange={(e) => setSwapAmountOutMin(e.target.value)}
                />
                <button
                  className="btn"
                  onClick={() => swapTokens.mutateAsync({
                    amountIn: new BN(swapAmountIn),
                    amountOutMin: new BN(swapAmountOutMin),
                    inputTokenMint: new PublicKey(inputTokenMint),
                    outputTokenMint: new PublicKey(outputTokenMint)
                  })}
                  disabled={swapTokens.isPending}
                >
                  Execute Swap {swapTokens.isPending && '...'}
                </button>
              </div>
            </div> */}

            {/* NFT Transfer Section */}
            {/* <div className="form-control">
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
                  className="btn"
                  onClick={() => sendNft.mutateAsync({
                    recipient: new PublicKey(nftRecipient),
                    mint: new PublicKey(nftRecipient)
                  })}
                  disabled={sendNft.isPending}
                >
                  Send NFT {sendNft.isPending && '...'}
            </button>
              </div>
            </div> */}

            {/* Token Creation Section */}
            {/* <div className="form-control">
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
                  className="btn"
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
            </div> */}

            {/* NFT Creation Section */}
            {/* <div className="form-control">
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
                  className="btn"
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
            </div> */}
            <br></br>
  
            
            {/* Chatbot Section */}
            <div className="p-1 border-b w-full" style={{
              background: `radial-gradient(
                circle farthest-side at 50% 100%,
                rgba(1, 9, 18, 0),
                rgba(1, 6, 14, 0.6) 36%,
                rgba(1, 14, 29, 0.6) 55%,
                rgba(61, 61, 65, 0.123)
              )`
            }}>
            </div>
            <h4 className="md:w-full text-2x1 md:text-4xl text-center text-slate-300 my-2" >
          <p>Chat</p>
        </h4>
            <div className="flex flex-col w-full max-h-[60vh]" style={{
              background: `radial-gradient(
                circle farthest-side at 50% 100%,
                rgba(1, 9, 18, 0),
                rgba(1, 6, 14, 0.6) 36%,
                rgba(1, 14, 29, 0.6) 55%,
                rgba(61, 61, 65, 0.123)
              )`
            }}>
              <div className="p-1 border-b w-full">
              </div>

              <ul ref={chatParent} className="h-[400px] p-4 overflow-y-auto flex flex-col gap-1">
                {messages.map((m, index) => (
                  <div key={index}>
                    {m.role === 'user' ? (
                      <li className="flex flex-row">
                        <div className="rounded-xl p-4 bg-base-100 shadow-md">
                          <p>{m.content}</p>
                        </div>
                      </li>
                    ) : (
                      <li className="flex flex-row-reverse">
                        <div className="rounded-xl p-4 bg-base-100 shadow-md w-3/4">
                          <p>{m.content}</p>
                        </div>
                      </li>
                    )}
                  </div>
                ))}
              </ul>

              <form onSubmit={handleSubmit} className="p-4 border-t w-full">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    className="flex-1"
                    placeholder="Ask or tell Sagent what to do..."
                    value={input}
                    onChange={handleInputChange}
                  />
                  <Button type="submit">Send</Button>
                </div>
              </form>
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
              className="btn"
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


