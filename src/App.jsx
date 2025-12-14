import "./App.css";
// import '@rainbow-me/rainbowkit/styles.css';
import Swap from "./Swap";
// import { WagmiProvider } from 'wagmi';
// import { bsc } from 'wagmi/chains';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// // import {
// //    RainbowKitProvider,
// // } from '@rainbow-me/rainbowkit';
// import { createConfig, http } from 'wagmi'
// import { metaMask,injected,walletConnect} from 'wagmi/connectors'
// // const config = getDefaultConfig({
// //   appName: 'PAX Presale',
// //   projectId: 'df16c2630664f97516d9b5cb166ca422',
// //   chains: [bsc],
// //   ssr: false,
// // });
// // 351b3f239bbc8fa19e699ba51c5e3c47

// export const config = createConfig({
//   chains: [bsc],
//   connectors: [
//     walletConnect({ 
//       projectId: '351b3f239bbc8fa19e699ba51c5e3c47',
//       showQrModal: true,
//       metadata: {
//         name: 'PAX Presale',
//         description: 'PAX Presale',
//         url: 'https://79dc932aff74.ngrok-free.app',
//         icons: ['https://79dc932aff74.ngrok-free.app/logo192.png']
//       }
//     }),,
//     metaMask()
//   ],
//   transports: {
//     [bsc.id]: http(),
//   },
// })
// const queryClient = new QueryClient();

// function App() {
//   return (
//     <WagmiProvider config={config}>
//       <QueryClientProvider client={queryClient}>
//           <div className="App">
//             <Swap />
//           </div>
//       </QueryClientProvider>
//     </WagmiProvider>
//   );
// }

// export default App;

import { createAppKit } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import { bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://dashboard.reown.com
// const projectId = 'df16c2630664f97516d9b5cb166ca422'
const projectId = 'b0b1d317d0727e18ab951cb9dfa21e5d'
// 2. Create a metadata object - optional
const metadata = {
  name: 'PAX Presale',
  description: 'PAX Presale',
  url:"https://ico-vite.netlify.app", // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks = [
  bsc
]
// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false, // Disable analytics
    onramp: false,    // Disable onramp
    swaps: false,     // Disable swaps
    email: false,     // Disable email
    socials: []       // Disable social logins
  },
  themeMode: 'dark'
})

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <div><Swap/></div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App;