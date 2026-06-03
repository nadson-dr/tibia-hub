import Link from "next/link";
import { Globe, Users, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceFilter } from "@/components/service/service-filter";
import type { TeamDoc, WithId } from "@/types";

export const dynamic = "force-dynamic";

const QUEST_LABELS: Record<string, string> = {
  soulwar: "Soul War",
  primal_ordeal: "Primal Ordeal",
  rotten_blood: "Rotten Blood",
};

async function getTeams(): Promise<WithId<TeamDoc>[]> {
  try {
    const { listApprovedTeams } = await import("@/lib/db/teams");
    return await listApprovedTeams();
  } catch {
    return [];
  }
}

export default async function ServicePage() {
  const teams = await getTeams();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <p className="mb-1 text-sm uppercase tracking-widest text-[var(--color-gold)]">
          Times de service
        </p>
        <h1 className="font-display text-3xl text-[var(--color-text)] sm:text-4xl">
          Encontre seu time
        </h1>
        <p className="mt-3 max-w-xl text-[var(--color-muted)]">
          Times verificados pelo Tibia Hub. Inscreva-se com seu personagem validado automaticamente
          — sem typos, sem fraude.
        </p>
      </div>

      {/* Filtro client-side por mundo */}
      <ServiceFilter teams={teams} questLabels={QUEST_LABELS} />
    </main>
  );
}
