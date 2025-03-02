'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'

import { ExplorerLink } from '../cluster/cluster-ui'
import { useSagentProgram } from './sagent-data-access'
import {  SagentCreate, SagentList } from './sagent-ui'


import { AppHero,ellipsify } from '../ui/ui-layout'


export default function DashboardFeature() {
  const { getConfig } = useSagentProgram()
  const { publicKey } = useWallet()

  return (
    <div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
        <img src="https://i.ibb.co/jv7X3q8c/sagent.png" alt="Sagent Logo" className="w-32 h-32 mx-auto" />
        <h4 className="md:w-full text-2x1 md:text-4xl text-center text-slate-300 my-2">
          <p>Welcome to Sagent</p>
          <p className='text-slate-500 text-2x1 leading-relaxed'>Solana under your command.</p>
        </h4>
        <br></br>
        <br></br>
        <br></br>
        
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {!getConfig.data && publicKey && (
            <div className="card bg-base-300">
              <div className="card-body">
                <h2 className="card-title">Initialize Protocol</h2>
                <SagentCreate />
              </div>
            </div>
          )}
          <SagentList />
        </div>
      </div>
    </div>
  )
}
