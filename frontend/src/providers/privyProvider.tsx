import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

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
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
