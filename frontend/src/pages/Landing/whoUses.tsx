// src/pages/landing/WhoUses.tsx
import { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useAvatarContext } from "@/context/avatarContext";
import { Actor } from "@/config/landing/actors";

interface Props {
  actors: Actor[];
}

export default function WhoUses({ actors }: Props) {
  const [paused, setPaused] = useState(false);
  const { avatars } = useAvatarContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // duplicamos para efecto infinito
  const items = [...actors, ...actors];

  useEffect(() => {
    if (paused || !scrollRef.current) return;
    const container = scrollRef.current;
    const interval = setInterval(() => {
      container.scrollLeft += 1;
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center mb-6">
        Para quién está pensado
      </h2>
      <div ref={scrollRef} className="relative overflow-hidden">
        <div className="flex gap-6 min-w-max">
          {items.map((actor, idx) => {
            const ActorAvatar = avatars[actor.avatarIndex].component;
            return (
              <Card
                key={idx}
                isPressable
                onPress={() => setPaused((prev) => !prev)}
                className="min-w-[250px] snap-center"
              >
                <CardHeader className="text-center font-semibold">
                  {actor.title}
                </CardHeader>
                <CardBody className="flex flex-col items-center text-center gap-3">
                  <ActorAvatar size={64} title={actor.title} />
                  <p className="text-sm text-ink/80 dark:text-milk/80">
                    {actor.description}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
