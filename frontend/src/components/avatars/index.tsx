import { AguilaAvatar } from "./aguila";
import { AlconAvatar } from "./alcon";
import { BufeoAvatar } from "./bufeo";
import { BuhoAvatar } from "./buho";
import { CondorAvatar } from "./condor";
import { GatoAvatar } from "./gato";
import { HormigueroAvatar } from "./hormiguero";
import { JaguarAvatar } from "./jaguar";
import { PumaAvatar } from "./puma";
import { QuirquinchoAvatar } from "./quirquincho";
import { RanaAvatar } from "./rana";
import { SuriAvatar } from "./suri";
import { VicuñaAvatar } from "./vicuña";
import { ZorroAvatar } from "./zorro";

export const avatars = [
  { name: "Rikuy el Cóndor de los Andes", component: CondorAvatar },
  { name: "Yara el Jaguar", component: JaguarAvatar },
  { name: "Inti el Puma", component: PumaAvatar },
  { name: "Kusi el Zorro", component: ZorroAvatar },
  { name: "Wayra el Halcón", component: AlconAvatar },
  { name: "Chaski el Quirquincho", component: QuirquinchoAvatar },
  { name: "Sumaq la Vicuña", component: VicuñaAvatar },
  { name: "Amaru el Sapo Andino", component: RanaAvatar },
  { name: "Qori el Gato Andino", component: GatoAvatar },
  { name: "Mara el Bufeo", component: BufeoAvatar },
  { name: "Tupaq el Oso Hormiguero", component: HormigueroAvatar },
  { name: "Suri el Ñandú", component: SuriAvatar },
  { name: "Limbert la Lechuza", component: BuhoAvatar },
  { name: "Killa el Águila Mora", component: AguilaAvatar },
];

// Selección estable por usuario (hash simple del address)
const hashToIndex = (seed: string, modulo: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  return Math.abs(h) % modulo;
};

type AvatarProps = {
  size?: number | string;
  className?: string;
  title?: string;
};

export const RandomAvatar: React.FC<AvatarProps & { seed?: string }> = ({
  size = 32,
  className = "",
  title = "RIKUY avatar",
  seed,
}) => {
  const index = seed
    ? hashToIndex(seed, avatars.length)
    : Math.floor(Math.random() * avatars.length);
  const AvatarComp = avatars[index].component;
  return <AvatarComp size={size} className={className} title={title} />;
};
