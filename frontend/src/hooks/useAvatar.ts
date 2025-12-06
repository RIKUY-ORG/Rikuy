// src/hooks/useAvatar.ts
import { avatars } from "@/components/avatars";
import { useEffect, useMemo, useState } from "react";

const hashToIndex = (seed: string, modulo: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % modulo;
};

export function useAvatar(seed?: string) {
  const storageKey = seed ? `rikuy:avatar:${seed}` : "rikuy:avatar:guest";
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Load persisted selection
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setSelectedIndex(Number(saved));
  }, [storageKey]);

  // Persist selection
  useEffect(() => {
    if (selectedIndex !== null) {
      localStorage.setItem(storageKey, String(selectedIndex));
    }
  }, [storageKey, selectedIndex]);

  // Fallback: stable random by seed
  const computedIndex = useMemo(() => {
    if (selectedIndex !== null) return selectedIndex;
    if (seed) return hashToIndex(seed, avatars.length);
    return Math.floor(Math.random() * avatars.length);
  }, [selectedIndex, seed]);

  const AvatarComp = avatars[computedIndex].component;
  const currentName = avatars[computedIndex].name;

  return {
    AvatarComp,          // componente actual
    currentIndex: computedIndex,
    currentName,         // nombre del avatar
    setSelectedIndex,    // para elegir manualmente
    avatars,             // lista completa [{ name, component }]
  };
}
