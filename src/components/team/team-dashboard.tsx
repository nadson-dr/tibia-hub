"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, Plus, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  TeamDoc,
  OfferingDoc,
  SignupDoc,
  WithId,
  TibiaVocation,
  CreateOfferingInput,
  UpdateSignupStatusInput,
  SignupStatus,
  QuestCode,
} from "@/types";

const QUEST_OPTIONS: { value: QuestCode; label: string }[] = [
  { value: "soulwar", label: "Soul War" },
  { value: "primal_ordeal", label: "Primal Ordeal" },
  { value: "rotten_blood", label: "Rotten Blood" },
];

const VOCATIONS: TibiaVocation[] = ["EK", "RP", "ED", "MS", "EM"];

const STATUS_LABELS: Record<SignupStatus, string> = {
  waiting: "Aguardando",
  scheduled: "Agendado",
  done: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_TONE = {
  waiting: "info",
  scheduled: "gold",
  done: "success",
  cancelled: "danger",
} as const;

const VOC_LABEL: Record<TibiaVocation, string> = {
  EK: "Elite Knight",
  RP: "Royal Paladin",
  ED: "Elder Druid",
  MS: "Master Sorcerer",
  EM: "Exalted Monk",
};

type Props = {
  team: WithId<TeamDoc>;
  offerings: WithId<OfferingDoc>[];
  signups: WithId<SignupDoc>[];
};

export function TeamDashboard({ team, offerings: initialOfferings, signups: initialSignups }: Props) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [signups, setSignups] = useState(initialSignups);
  const [activeTab, setActiveTab] = useState<TibiaVocation | "all">("all");
  const [activeOfferingId, setActiveOfferingId] = useState<string | null>(
    initialOfferings.find((o) => o.status === "open")?.id ?? initialOfferings[0]?.id ?? null,
  );
  const [showNewOffering, setShowNewOffering] = useState(false);

  const activeOffering = offerings.find((o) => o.id === activeOfferingId) ?? null;

  const offeringSignups = signups.filter((s) => s.offeringId === activeOfferingId);
  const filteredSignups =
    activeTab === "all"
      ? offeringSignups
      : offeringSignups.filter((s) => s.vocation === activeTab);

  const handleStatusChange = async (signupId: string, status: SignupStatus) => {
    try {
      const { updateSignupStatus } = await import("@/server/actions/signups");
      const input: UpdateSignupStatusInput = { signupId, status };
      const result = await updateSignupStatus(input);
      if (result.ok) {
        setSignups((prev) =>
          prev.map((s) => (s.id === signupId ? { ...s, status } : s)),
        );
      }
    } catch {
      // Erro silencioso no MVP — o orquestrador liga a action
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-[var(--color-gold)]">Painel do time</p>
          <h1 className="font-display text-3xl text-[var(--color-text)]">{team.name}</h1>
          {!team.approved && (
            <div className="mt-1 flex items-center gap-1.5">
              <Badge tone="info">Aguardando aprovação</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                Seu time aparecerá em /service após a revisão.
              </span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewOffering((v) => !v)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova fila
        </Button>
      </div>

      {/* Formulário de nova oferta */}
      {showNewOffering && (
        <NewOfferingForm
          team={team}
          onCreated={(offering) => {
            setOfferings((prev) => [...prev, offering]);
            setActiveOfferingId(offering.id);
            setShowNewOffering(false);
          }}
          onCancel={() => setShowNewOffering(false)}
        />
      )}

      {/* Seletor de oferta */}
      {offerings.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {offerings.map((offering) => {
            const questLabel =
              QUEST_OPTIONS.find((q) => q.value === offering.quest)?.label ?? offering.quest;
            const isActive = offering.id === activeOfferingId;
            return (
              <button
                key={offering.id}
                onClick={() => setActiveOfferingId(offering.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
                  isActive
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                )}
                aria-pressed={isActive}
              >
                {questLabel}
                <span className="ml-1.5 text-xs opacity-70">{offering.world}</span>
              </button>
            );
          })}
        </div>
      )}

      {offerings.length === 0 ? (
        <EmptyOfferings onOpen={() => setShowNewOffering(true)} />
      ) : activeOffering ? (
        <>
          {/* Tabs de vocação */}
          <div
            className="mb-4 flex gap-1 border-b border-[var(--color-border)]"
            role="tablist"
            aria-label="Filtrar por vocação"
          >
            {(["all", ...VOCATIONS] as const).map((voc) => {
              const count =
                voc === "all"
                  ? offeringSignups.length
                  : offeringSignups.filter((s) => s.vocation === voc).length;
              return (
                <button
                  key={voc}
                  role="tab"
                  aria-selected={activeTab === voc}
                  onClick={() => setActiveTab(voc)}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded-t",
                    activeTab === voc
                      ? "border-b-2 border-[var(--color-gold)] text-[var(--color-gold)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  {voc === "all" ? "Todos" : voc}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-xs">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Fila */}
          {filteredSignups.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-muted)]">
              <p>Nenhuma inscrição {activeTab !== "all" ? `para ${activeTab}` : ""} ainda.</p>
            </div>
          ) : (
            <>
              {/* Desktop: tabela */}
              <div className="hidden sm:block">
                <table className="w-full text-sm" aria-label="Lista de inscrições">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">Personagem</th>
                      <th className="pb-2 pr-4">Voc.</th>
                      <th className="pb-2 pr-4">Level</th>
                      <th className="pb-2 pr-4">Mundo</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignups
                      .sort((a, b) => a.queueOrder - b.queueOrder)
                      .map((signup) => (
                        <SignupRow
                          key={signup.id}
                          signup={signup}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filteredSignups
                  .sort((a, b) => a.queueOrder - b.queueOrder)
                  .map((signup) => (
                    <SignupCard
                      key={signup.id}
                      signup={signup}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}

// ─── Linha da tabela ────────────────────────────────────────────────────────

function SignupRow({
  signup,
  onStatusChange,
}: {
  signup: WithId<SignupDoc>;
  onStatusChange: (id: string, status: SignupStatus) => Promise<void>;
}) {
  const tone = STATUS_TONE[signup.status] ?? "neutral";
  const waLink = signup.contact.whatsapp
    ? `https://wa.me/${signup.contact.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
      <td className="py-3 pr-4 text-[var(--color-muted)]">{signup.queueOrder}</td>
      <td className="py-3 pr-4 font-medium text-[var(--color-text)]">{signup.characterName}</td>
      <td className="py-3 pr-4">
        <Badge tone={tone === "gold" ? "gold" : "neutral"}>{signup.vocation}</Badge>
      </td>
      <td className="py-3 pr-4 text-[var(--color-muted)]">{signup.level}</td>
      <td className="py-3 pr-4 text-[var(--color-muted)]">{signup.world}</td>
      <td className="py-3 pr-4">
        <Badge tone={tone}>{STATUS_LABELS[signup.status]}</Badge>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-success)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
              aria-label={`WhatsApp de ${signup.characterName}`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <StatusDropdown
            current={signup.status}
            onChange={(s) => void onStatusChange(signup.id, s)}
          />
        </div>
      </td>
    </tr>
  );
}

// ─── Card mobile ─────────────────────────────────────────────────────────────

function SignupCard({
  signup,
  onStatusChange,
}: {
  signup: WithId<SignupDoc>;
  onStatusChange: (id: string, status: SignupStatus) => Promise<void>;
}) {
  const tone = STATUS_TONE[signup.status] ?? "neutral";
  const waLink = signup.contact.whatsapp
    ? `https://wa.me/${signup.contact.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-muted)]">#{signup.queueOrder}</span>
              <p className="font-medium text-[var(--color-text)]">{signup.characterName}</p>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {signup.vocation} · Lv {signup.level} · {signup.world}
            </p>
          </div>
          <Badge tone={tone}>{STATUS_LABELS[signup.status]}</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : (
            <span className="text-xs text-[var(--color-muted)]">Sem WhatsApp</span>
          )}
          <StatusDropdown
            current={signup.status}
            onChange={(s) => void onStatusChange(signup.id, s)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dropdown de status ───────────────────────────────────────────────────────

function StatusDropdown({
  current,
  onChange,
}: {
  current: SignupStatus;
  onChange: (s: SignupStatus) => void;
}) {
  const NEXT_STATUS: Record<SignupStatus, SignupStatus[]> = {
    waiting: ["scheduled", "cancelled"],
    scheduled: ["done", "waiting", "cancelled"],
    done: [],
    cancelled: ["waiting"],
  };

  const options = NEXT_STATUS[current];
  if (options.length === 0) return null;

  return (
    <Select
      aria-label="Mover status"
      value=""
      onChange={(e) => {
        if (e.target.value) onChange(e.target.value as SignupStatus);
      }}
      className="h-7 w-auto text-xs py-0"
    >
      <option value="" disabled>
        Mover para...
      </option>
      {options.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}

// ─── Formulário de nova oferta ────────────────────────────────────────────────

function NewOfferingForm({
  team,
  onCreated,
  onCancel,
}: {
  team: WithId<TeamDoc>;
  onCreated: (offering: WithId<OfferingDoc>) => void;
  onCancel: () => void;
}) {
  const [quest, setQuest] = useState<QuestCode>("soulwar");
  const [world, setWorld] = useState(team.worlds[0] ?? "");
  const [slots, setSlots] = useState<Partial<Record<TibiaVocation, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!world) {
      setError("Selecione um mundo.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const input: CreateOfferingInput = {
        teamId: team.id,
        quest,
        world,
        vocationSlots: slots,
        kind: "service",
      };

      const { createOffering } = await import("@/server/actions/offerings");
      const result = await createOffering(input);

      if (!result.ok) {
        setError(result.error ?? "Erro ao criar fila.");
      } else {
        onCreated(result.value);
      }
    } catch {
      setError("Erro ao criar fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-[var(--color-gold)]/30">
      <CardHeader>
        <CardTitle>Abrir nova fila</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Quest"
              value={quest}
              onChange={(e) => setQuest(e.target.value as QuestCode)}
              disabled={loading}
            >
              {QUEST_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </Select>

            <Select
              label="Mundo"
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um mundo</option>
              {team.worlds.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </div>

          {/* Vagas por vocação */}
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
              Vagas por vocação (0 = ilimitado)
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {VOCATIONS.map((voc) => (
                <div key={voc} className="flex flex-col gap-1">
                  <label
                    htmlFor={`slot-${voc}`}
                    className="text-center text-xs font-medium text-[var(--color-muted)]"
                  >
                    {voc}
                  </label>
                  <input
                    id={`slot-${voc}`}
                    type="number"
                    min="0"
                    max="99"
                    value={slots[voc] ?? ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setSlots((prev) => ({
                        ...prev,
                        [voc]: isNaN(v) ? undefined : v,
                      }));
                    }}
                    placeholder="0"
                    disabled={loading}
                    className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 text-center text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                    aria-label={`Vagas para ${voc}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="gold" disabled={loading}>
              {loading ? "Abrindo..." : "Abrir fila"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOfferings({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="rounded-full border border-[var(--color-border)] p-4">
        <Plus className="h-8 w-8 text-[var(--color-muted)]" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[var(--color-text)]">Nenhuma fila aberta</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Abra sua primeira fila e comece a receber inscrições.
        </p>
      </div>
      <Button variant="gold" onClick={onOpen}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Abrir fila
      </Button>
    </div>
  );
}
