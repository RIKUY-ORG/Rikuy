import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
<<<<<<< HEAD

export function RikuyPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["wallet", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "dark",
          accentColor: "#4F46E5",
=======
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
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
