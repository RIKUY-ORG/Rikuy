// src/config/landing/types.ts
export type HeroConfig = {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  missionNote?: string;
};

export type ProblemItem = { title: string; description: string };
export type ProblemConfig = { headline: string; items: ProblemItem[] };

export type SolutionPoint = { label: string; description: string };
export type SolutionConfig = { headline: string; points: SolutionPoint[] };

export type HowItWorksStep = { title: string; description: string };
export type HowItWorksConfig = { headline: string; steps: HowItWorksStep[] };

export type TrustConfig = {
  headline: string;
  notes: string[];
  badges?: { label: string }[];
};

export type CountryConfig = {
  hero: HeroConfig;
  problem: ProblemConfig;
  solution: SolutionConfig;
  howItWorks: HowItWorksConfig;
  trust: TrustConfig;
};
