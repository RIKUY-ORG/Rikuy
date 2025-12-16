// src/pages/landing/index.tsx
import DefaultLayout from "@/layouts/default";
import { boliviaConfig } from "@/config/landing/bolivia";
import { defaultConfig } from "@/config/landing/default";
import { Hero } from "./hero";
import { Problem } from "./problem";
import { Solution } from "./solution";
import { HowItWorks } from "./howItWoerks";
import { Trust } from "./trust";
import { CTA } from "./cta";
import WhoUses from "./whoUses";
import { boliviaActors } from "@/config/landing/actors";
import { MetricsSummary } from "./metricsSummary";

const getCountryConfig = () => {
    // Durante el piloto, usa Bolivia por defecto.
    // Luego puedes detectar país por dominio/IP o selector manual.
    return boliviaConfig ?? defaultConfig;
};

export default function LandingPage() {
    const config = getCountryConfig();

    return (
        <DefaultLayout>
            <Hero config={config.hero} />
            <Problem config={config.problem} />
            <Solution config={config.solution} />
            <HowItWorks config={config.howItWorks} />
            <Trust config={config.trust} />
            <WhoUses actors={boliviaActors} />
            <MetricsSummary /> 
            <CTA />
        </DefaultLayout>
    );
}
