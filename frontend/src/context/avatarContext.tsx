import React, { createContext, useContext, useState, useEffect } from "react";
import { avatars } from "@/components/avatars";

type AvatarContextType = {
  selectedIndex: number | null;
  setSelectedIndex: (index: number) => void;
  currentIndex: number;
  currentName: string;
  AvatarComp: React.FC<{ size?: number | string; className?: string; title?: string }>;
  avatars: typeof avatars;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider: React.FC<{ seed?: string; children: React.ReactNode }> = ({
  seed,
  children,
}) => {
  const storageKey = seed ? `rikuy:avatar:${seed}` : "rikuy:avatar:guest";
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // cargar desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setSelectedIndex(Number(saved));
    }
  }, [storageKey]);

  // persistir cambios
  useEffect(() => {
    if (typeof window !== "undefined" && selectedIndex !== null) {
      localStorage.setItem(storageKey, String(selectedIndex));
    }
  }, [storageKey, selectedIndex]);

  // fallback: hash estable por seed
  const hashToIndex = (seed: string, modulo: number) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h << 5) - h + seed.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % modulo;
  };

  const currentIndex =
    selectedIndex !== null
      ? selectedIndex
      : seed
      ? hashToIndex(seed, avatars.length)
      : Math.floor(Math.random() * avatars.length);

  const AvatarComp = avatars[currentIndex].component;
  const currentName = avatars[currentIndex].name;

  return (
    <AvatarContext.Provider
      value={{ selectedIndex, setSelectedIndex, currentIndex, currentName, AvatarComp, avatars }}
    >
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatarContext = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatarContext debe usarse dentro de AvatarProvider");
  return ctx;
};
