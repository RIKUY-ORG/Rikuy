"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function RikuyPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmi6g8mcx009vl40dv36zpwv6"   // 👈 tu App ID desde el dashboard de Privy
      clientId="client-WY6TBXtetw4n8efSEtZWx8NtBzXaKm5Swf67xBT1QnvJg"      // 👈 si configuraste OAuth (Google, etc.)
      config={{
        loginMethods: ["wallet", "google"],

        // 👇 configuración correcta para embedded wallets
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets", // o "all-users"
          },
        },

        // 👇 apariencia: solo "light" o "dark"
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
