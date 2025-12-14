
import React from 'react'
import { useConnectors } from 'wagmi'
import { useConnect } from 'wagmi'
import { useConnection } from 'wagmi'
import { useDisconnect } from 'wagmi'
export const ConnectButton = () => {
    const { connect } = useConnect()
    const connectors = useConnectors()
    const connection = useConnection()
    const diconnector = useDisconnect()
    console.log(connection.address)
    return (
        <div>
            {connection.address && (
                <div className='bg-green-500 text-white p-2 rounded-md' onClick={() => diconnector.disconnect()}>
                    <p>Connected to {connection.address}</p>
                </div>
            )}
            {!connection.address && (
                connectors.map((connector) => (
                <button className='bg-black text-white p-2 rounded-md' key={connector.uid} onClick={() => connect({ connector })}>
                    {connector.name}
                    Connect Button
                </button>
            ))
            )}
        </div>
    )
}