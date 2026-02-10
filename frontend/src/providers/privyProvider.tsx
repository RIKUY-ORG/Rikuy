import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { rikuyChain } from "../config/chain";

export function RikuyPrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  const clientId = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;

  if (!appId) {
    console.warn("⚠️ Privy App ID is missing in .env (VITE_PRIVY_APP_ID)");
    // Renderizamos children igual para no romper la app en dev sin auth
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        loginMethods: ['email','wallet','google'],
        defaultChain: rikuyChain,
        supportedChains: [rikuyChain],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6D28D9',
          logo: '/rikuy-logo.png',
          showWalletLoginFirst: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
