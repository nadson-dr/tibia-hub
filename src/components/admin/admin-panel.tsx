"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Users, Coins, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DonationDoc, TeamDoc, WithId } from "@/types";

type Props = {
  initialDonations: WithId<DonationDoc>[];
  initialTeams: WithId<TeamDoc>[];
};

export function AdminPanel({ initialDonations, initialTeams }: Props) {
  const [donations, setDonations] = useState(initialDonations);
  const [teams, setTeams] = useState(initialTeams);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResolveDonation = async (donationId: string, decision: "confirm" | "reject") => {
    setLoadingId(donationId);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[donationId];
      return next;
    });

    try {
      const { resolveDonation } = await import("@/server/actions/admin");
      const result = await resolveDonation({ donationId, decision });

      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [donationId]: result.error ?? "Erro ao processar." }));
      } else {
        setDonations((prev) => prev.filter((d) => d.id !== donationId));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [donationId]: "Erro inesperado. Tente novamente." }));
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveTeam = async (teamId: string) => {
    setLoadingId(teamId);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });

    try {
      const { approveTeam } = await import("@/server/actions/admin");
      const result = await approveTeam(teamId);

      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [teamId]: result.error ?? "Erro ao aprovar time." }));
      } else {
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [teamId]: "Erro inesperado. Tente novamente." }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Doações pendentes */}
      <section aria-labelledby="donations-heading">
        <div className="mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-[var(--color-gold)]" aria-hidden="true" />
          <h2 id="donations-heading" className="font-display text-xl text-[var(--color-text)]">
            Doações pendentes
          </h2>
          {donations.length > 0 && (
            <Badge tone="info" aria-label={`${donations.length} doações pendentes`}>
              {donations.length}
            </Badge>
          )}
        </div>

        {donations.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />}
            message="Nenhuma doação pendente."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                loading={loadingId === donation.id}
                error={errors[donation.id]}
                onConfirm={() => void handleResolveDonation(donation.id, "confirm")}
                onReject={() => void handleResolveDonation(donation.id, "reject")}
              />
            ))}
          </div>
        )}
      </section>

      {/* Times pendentes */}
      <section aria-labelledby="teams-heading">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-gold)]" aria-hidden="true" />
          <h2 id="teams-heading" className="font-display text-xl text-[var(--color-text)]">
            Times aguardando aprovação
          </h2>
          {teams.length > 0 && (
            <Badge tone="info" aria-label={`${teams.length} times pendentes`}>
              {teams.length}
            </Badge>
          )}
        </div>

        {teams.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />}
            message="Nenhum time aguardando aprovação."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                loading={loadingId === team.id}
                error={errors[team.id]}
                onApprove={() => void handleApproveTeam(team.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── DonationCard ─────────────────────────────────────────────────────────────

function DonationCard({
  donation,
  loading,
  error,
  onConfirm,
  onReject,
}: {
  donation: WithId<DonationDoc>;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const date = new Date(donation.requestedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-info)]" aria-hidden="true" />
              <p className="text-sm font-medium text-[var(--color-text)]">
                {donation.userEmail}
              </p>
            </div>
            {donation.note && (
              <p className="text-xs text-[var(--color-muted)]">
                Personagem: <strong className="text-[var(--color-text)]">{donation.note}</strong>
              </p>
            )}
            <p className="text-xs text-[var(--color-muted)]">
              {donation.tcAmount} TC · {date}
            </p>
            <Badge tone="neutral" className="self-start text-xs">
              {PURPOSE_LABELS[donation.purpose] ?? donation.purpose}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={loading}
              aria-label={`Rejeitar doação de ${donation.userEmail}`}
              className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Rejeitar</span>
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={onConfirm}
              disabled={loading}
              aria-label={`Confirmar doação de ${donation.userEmail}`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Confirmar</span>
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-3 flex items-start gap-2 text-xs text-[var(--color-danger)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TeamCard ─────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  loading,
  error,
  onApprove,
}: {
  team: WithId<TeamDoc>;
  loading: boolean;
  error?: string;
  onApprove: () => void;
}) {
  const date = new Date(team.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-[var(--color-text)]">{team.name}</p>
            <p className="text-xs text-[var(--color-muted)]">
              /{team.slug} · criado em {date}
            </p>
            {team.worlds.length > 0 && (
              <p className="text-xs text-[var(--color-muted)]">
                Mundos: {team.worlds.slice(0, 5).join(", ")}
                {team.worlds.length > 5 && ` +${team.worlds.length - 5}`}
              </p>
            )}
          </div>

          <Button
            variant="gold"
            size="sm"
            onClick={onApprove}
            disabled={loading}
            aria-label={`Aprovar time ${team.name}`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Aprovar</span>
          </Button>
        </div>

        {error && (
          <div role="alert" className="mt-3 flex items-start gap-2 text-xs text-[var(--color-danger)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center">
      <div className="text-[var(--color-muted)]">{icon}</div>
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<string, string> = {
  team_owner: "Dono de time",
};
