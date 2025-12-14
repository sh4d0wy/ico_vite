
import { useConnectWallet, useWallets } from '@privy-io/react-auth'
import React from 'react'
import { useEffect } from 'react';
import { useConnection, useDisconnect } from 'wagmi'
import { bnbChainId } from './utils/constants';
export const ConnectButton = () => {
    const {connectWallet} = useConnectWallet();
    const {address, isConnected} = useConnection();
    const {disconnect} = useDisconnect();

    const {wallets} = useWallets();
    const connectedWallet = wallets.find(w => w.address?.toLowerCase() === address?.toLowerCase());
    
    useEffect(()=>{
        if(connectedWallet){
            console.log("Connected wallet found");
            console.log("Connected wallet:", connectedWallet);
        const switchChain = async ()=>{
            const provider = await connectedWallet.getEthereumProvider();
            console.log("Provider found:", provider);
            if(provider){
                await provider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: `0x${bnbChainId.toString(16)}` }],
                });
                console.log("Chain switched successfully");
            }else{
                console.log("No provider found");
            }
        }
        switchChain();
        }
    }, [connectedWallet]);

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