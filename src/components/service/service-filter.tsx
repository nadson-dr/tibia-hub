"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Globe, Users, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamDoc, WithId } from "@/types";

type Props = {
  teams: WithId<TeamDoc>[];
  questLabels: Record<string, string>;
};

export function ServiceFilter({ teams, questLabels: _ }: Props) {
  const [worldFilter, setWorldFilter] = useState("");

  // Coletar todos os mundos únicos dos times
  const allWorlds = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => t.worlds.forEach((w) => set.add(w)));
    return Array.from(set).sort();
  }, [teams]);

  const filtered = useMemo(() => {
    if (!worldFilter) return teams;
    return teams.filter((t) => t.worlds.includes(worldFilter));
  }, [teams, worldFilter]);

  return (
    <>
      {/* Filtro por mundo */}
      {allWorlds.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--color-muted)]">Filtrar por mundo:</span>
          <button
            onClick={() => setWorldFilter("")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
              !worldFilter
                ? "border-[var(--color-gold)] bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
            aria-pressed={!worldFilter}
          >
            Todos
          </button>
          {allWorlds.map((world) => (
            <button
              key={world}
              onClick={() => setWorldFilter(world === worldFilter ? "" : world)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
                worldFilter === world
                  ? "border-[var(--color-gold)] bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
              )}
              aria-pressed={worldFilter === world}
            >
              {world}
            </button>
          ))}
        </div>
      )}

      {/* Lista de times */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Users className="h-12 w-12 text-[var(--color-muted)]" aria-hidden="true" />
          <p className="text-[var(--color-muted)]">
            {worldFilter
              ? `Nenhum time encontrado no mundo ${worldFilter}.`
              : "Nenhum time disponível no momento."}
          </p>
          {worldFilter && (
            <button
              onClick={() => setWorldFilter("")}
              className="text-sm text-[var(--color-gold)] hover:underline"
            >
              Ver todos os mundos
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </>
  );
}

function TeamCard({ team }: { team: WithId<TeamDoc> }) {
  return (
    <Link href={`/g/${team.slug}`} className="block group">
      <Card className="h-full transition-colors hover:border-[var(--color-gold)]/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-[var(--color-gold)] transition-colors">
              {team.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              {team.supporterBadge && (
                <Badge tone="gold" aria-label="Time apoiador">
                  Apoiador
                </Badge>
              )}
              <ChevronRight
                className="h-4 w-4 text-[var(--color-muted)] group-hover:text-[var(--color-gold)] transition-colors"
                aria-hidden="true"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {team.description && (
            <p className="mb-3 line-clamp-2 text-[var(--color-muted)]">{team.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
            {team.worlds.slice(0, 3).map((w) => (
              <span key={w} className="text-xs text-[var(--color-muted)]">
                {w}
              </span>
            ))}
            {team.worlds.length > 3 && (
              <span className="text-xs text-[var(--color-muted)]">
                +{team.worlds.length - 3}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
