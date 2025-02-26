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
      <AppHero title="Say hello to your on-chain assistant." subtitle="SAGENT - OC" />
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
