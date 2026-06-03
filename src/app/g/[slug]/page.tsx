import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, MessageCircle, Instagram, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamDoc, OfferingDoc, WithId } from "@/types";

export const dynamic = "force-dynamic";

const QUEST_LABELS: Record<string, string> = {
  soulwar: "Soul War",
  primal_ordeal: "Primal Ordeal",
  rotten_blood: "Rotten Blood",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  paused: "Pausada",
  closed: "Encerrada",
};

const STATUS_TONE = {
  open: "success",
  paused: "info",
  closed: "danger",
} as const;

const VOC_LABELS: Record<string, string> = {
  EK: "EK",
  RP: "RP",
  ED: "ED",
  MS: "MS",
  EM: "EM",
};

async function getTeam(slug: string): Promise<WithId<TeamDoc> | null> {
  try {
    const { getTeamBySlug } = await import("@/lib/db/teams");
    return await getTeamBySlug(slug);
  } catch {
    return null;
  }
}

async function getOfferings(teamId: string): Promise<WithId<OfferingDoc>[]> {
  try {
    const { listOfferingsByTeam } = await import("@/lib/db/offerings");
    return await listOfferingsByTeam(teamId);
  } catch {
    return [];
  }
}

export default async function TeamPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeam(slug);

  if (!team || !team.approved) {
    notFound();
  }

  const offerings = await getOfferings(team.id);
  const openOfferings = offerings.filter((o) => o.status === "open");

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Header do time */}
      <div className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {team.supporterBadge && <Badge tone="gold">Apoiador</Badge>}
            </div>
            <h1 className="font-display text-3xl text-[var(--color-text)] sm:text-4xl">
              {team.name}
            </h1>
          </div>
          {/* Contatos */}
          <div className="flex flex-wrap gap-2">
            {team.approved && (
              <Badge tone="success" aria-label="Time verificado">
                Verificado
              </Badge>
            )}
          </div>
        </div>

        {team.description && (
          <p className="mt-4 max-w-2xl text-[var(--color-muted)]">{team.description}</p>
        )}

        {/* Mundos */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
          {team.worlds.map((w) => (
            <span
              key={w}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Ofertas */}
      <section aria-labelledby="offerings-heading">
        <h2
          id="offerings-heading"
          className="mb-4 font-display text-xl text-[var(--color-text)]"
        >
          Filas disponíveis
          {openOfferings.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--color-gold)]">
              {openOfferings.length} aberta{openOfferings.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {openOfferings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--color-muted)]">
                Nenhuma fila aberta no momento.
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Volte mais tarde ou entre em contato com o time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openOfferings.map((offering) => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                teamSlug={team.slug}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function OfferingCard({
  offering,
  teamSlug,
}: {
  offering: WithId<OfferingDoc>;
  teamSlug: string;
}) {
  const tone = STATUS_TONE[offering.status] ?? "neutral";
  const questLabel = QUEST_LABELS[offering.quest] ?? offering.quest;

  const slots = Object.entries(offering.vocationSlots) as [string, number][];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{questLabel}</CardTitle>
          <Badge tone={tone} aria-label={`Status: ${STATUS_LABELS[offering.status]}`}>
            {STATUS_LABELS[offering.status] ?? offering.status}
          </Badge>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Mundo: {offering.world}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        {/* Vagas por vocação */}
        {slots.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
              Vagas por vocação
            </p>
            <div className="flex flex-wrap gap-2">
              {slots.map(([voc, qty]) => (
                <span
                  key={voc}
                  className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                  aria-label={`${VOC_LABELS[voc] ?? voc}: ${qty} vagas`}
                >
                  <span className="font-medium text-[var(--color-text)]">{VOC_LABELS[voc] ?? voc}</span>
                  <span>{qty}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <Link href={`/g/${teamSlug}/a/${offering.id}/signup`}>
            <Button variant="gold" className="w-full" size="sm">
              Entrar na fila
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
