// src/pages/perfil/index.tsx
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { usePrivy } from "@privy-io/react-auth";
import { useIdentity } from '@/context/identityContext';
import { useAvatarContext } from "@/context/avatarContext";

import { VerificationCard } from "./components/VerificationCard";
import { AvatarSection } from "./components/AvatarSection";
import { WalletCard } from "./components/WalletCard";
import { PreferencesCard } from "./components/PreferencesCard";
import { LegalLinks } from "./components/LegalLinks";
import { SocialLinks } from "./components/SocialLinks";
import { LogoutButton } from "./components/LogoutButton";

export default function PerfilPage() {
  const { user, authenticated } = usePrivy();
    const { isVerified, isLoading } = useIdentity();
  const avatarContext = useAvatarContext();

  if (!authenticated) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
          <h1 className={title()}>Mi Perfil</h1>
          <p className="text-sm text-default-500">
            No has iniciado sesión. Por favor, accede desde la página de Login.
          </p>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center py-12 md:py-20 px-4">
        <h1 className={title()}>Mi Perfil</h1>
        
        <div className="w-full max-w-2xl mt-8 space-y-6">
          {/* Verificación de identidad */}
          <VerificationCard isVerified={isVerified} isLoading={isLoading} />

          {/* Avatar y selector */}
          <AvatarSection context={avatarContext} />

          {/* Wallet */}
          <WalletCard walletAddress={user?.wallet?.address} />

          {/* Preferencias */}
          <PreferencesCard />

          {/* Enlaces legales y ayuda */}
          <LegalLinks />

          {/* Redes sociales */}
          <SocialLinks />

          {/* Cerrar sesión */}
          <LogoutButton />
        </div>
      </section>
    </DefaultLayout>
  );
}