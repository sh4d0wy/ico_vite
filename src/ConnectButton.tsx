
import { useConnectWallet } from '@privy-io/react-auth'
import React from 'react'
import { useConnection, useDisconnect } from 'wagmi'
export const ConnectButton = () => {
    const {connectWallet} = useConnectWallet();
    const {address, isConnected} = useConnection();
    const {disconnect} = useDisconnect();
    return (
        <div className="text-xs">
            {isConnected && (
                <div className='bg-gray-800 border border-gray-700 text-white cursor-pointer hover:bg-gray-700 transition-all duration-200 p-2 rounded-full flex gap-2 items-center' onClick={() => disconnect()}>
                    <img src="/images/BSC-logo.png" alt="bnb" className="w-3 h-3" />
                    <p>Connected to {address?.slice(0, 6)}...{address?.slice(-7)}</p>
                </div>
            )}
            {!isConnected && (
                <button className='bg-black text-white p-2 rounded-full px-4 border border-gray-700 hover:bg-gray-700 transition-all duration-200 cursor-pointer' onClick={() => connectWallet()}>
                    Connect Wallet
                </button>
            )}
        </div>
    )
}