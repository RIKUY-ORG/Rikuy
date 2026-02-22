// src/components/UserButton.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrivy } from '@privy-io/react-auth';
import { useIdentityStatus } from '@/hooks/useIdentityStatus';
import { User, LogOut, Shield, Settings } from 'lucide-react';

export function UserButton() {
  const { user, logout } = usePrivy();
  const { isVerified } = useIdentityStatus();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 p-0.5"
      >
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          <User size={18} className="text-primary-600" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-lg border border-default-200 dark:border-default-800 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 border-b border-default-100">
              <p className="text-xs text-default-500 truncate">
                {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </p>
              {!isVerified && (
                <div className="mt-2">
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Pendiente de verificación
                  </span>
                </div>
              )}
            </div>

            <button className="w-full px-4 py-2 text-left hover:bg-default-100 dark:hover:bg-default-800 flex items-center gap-2">
              <Settings size={16} />
              <span>Configuración</span>
            </button>

            <button className="w-full px-4 py-2 text-left hover:bg-default-100 dark:hover:bg-default-800 flex items-center gap-2">
              <Shield size={16} />
              <span>Privacidad</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}