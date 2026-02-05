'use client'

import { Coins } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

export const CoinBalance = () => {
    const wallet = useQuery(api.gamification.getWallet)

    if (wallet === undefined) {
        return <Skeleton className="h-8 w-16 rounded-full" />
    }

    if (!wallet) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors cursor-default">
                        <Coins className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold font-mono">{wallet.balance}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>IdeaCoins Balance</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
