"use client";

import { useState, useEffect, type FormEvent } from "react";
import { UserCircle, Plus, CheckCircle2, AlertCircle, Coins, Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CharacterDoc, Result, SupporterStatus } from "@/types";
import { DONATION } from "@/config/donation";

export const dynamic = "force-dynamic";

type CharWithId = CharacterDoc & { id: string };

const VOC_LABELS: Record<string, string> = {
  EK: "Elite Knight",
  RP: "Royal Paladin",
  ED: "Elder Druid",
  MS: "Master Sorcerer",
  EM: "Exalted Monk",
};

export default function MePage() {
  const { user } = useAuth();

  const [characters, setCharacters] = useState<CharWithId[]>([]);
  const [charName, setCharName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [supporterStatus, setSupporterStatus] = useState<SupporterStatus | "loading">("loading");
  const [donationNote, setDonationNote] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSent, setDonationSent] = useState(false);

  // Carrega os personagens ja cadastrados ao montar
  useEffect(() => {
    if (!user) {
      setListLoading(false);
      return;
    }
    let active = true;
    setListLoading(true);
    void (async () => {
      try {
        const { listMyCharacters } = await import("@/server/actions/characters");
        const list = await listMyCharacters();
        if (active) setCharacters(list);
      } catch {
        // falha silenciosa de leitura nao bloqueia a pagina
      } finally {
        if (active) setListLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Carrega o status de Apoiador ao montar
  useEffect(() => {
    if (!user) {
      setSupporterStatus("none");
      return;
    }
    let active = true;
    void (async () => {
      try {
        const { getMySupporterStatus } = await import("@/server/actions/donations");
        const s = await getMySupporterStatus();
        if (active) setSupporterStatus(s);
      } catch {
        if (active) setSupporterStatus("none");
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-[var(--color-muted)]">
          Voce precisa estar logado para acessar esta pagina.
        </p>
      </main>
    );
  }

  const handleAddCharacter = async (e: FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);

    try {
      const { addCharacter } = await import("@/server/actions/characters");
      const result: Result<CharacterDoc & { id: string }> = await addCharacter({ name: charName.trim() });

      if (!result.ok) {
        const errorMessages: Record<string, string> = {
          not_found: "Personagem nao encontrado na TibiaData. Verifique o nome.",
          unpromoted: "O personagem precisa ter vocacao promovida (EK, RP, ED, MS ou EM).",
          already_exists: "Este personagem ja esta na sua lista.",
          network: "Erro de conexao com a TibiaData. Tente novamente.",
        };
        setAddError(errorMessages[result.error] ?? result.error);
      } else {
        setCharacters((prev) => [...prev, result.value]);
        setCharName("");
        setAddSuccess(`${result.value.name} adicionado com sucesso!`);
      }
    } catch {
      setAddError("Erro ao adicionar personagem. Tente novamente.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRequestDonation = async (e: FormEvent) => {
    e.preventDefault();
    setDonationError(null);
    setDonationLoading(true);

    try {
      const { requestDonation } = await import("@/server/actions/donations");
      const result = await requestDonation({
        purpose: "team_owner",
        note: donationNote.trim() || undefined,
      });

      if (!result.ok) {
        setDonationError(result.error ?? "Erro ao registrar doacao.");
      } else {
        setDonationSent(true);
        setSupporterStatus("pending");
      }
    } catch {
      setDonationError("Erro ao registrar doacao. Tente novamente.");
    } finally {
      setDonationLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <UserCircle className="h-8 w-8 text-[var(--color-gold)]" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl text-[var(--color-text)]">Meu perfil</h1>
          <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
        </div>
      </div>

      {/* Apoiador */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Apoiador</CardTitle>
            <SupporterBadge status={supporterStatus} />
          </div>
        </CardHeader>
        <CardContent>
          {supporterStatus === "loading" && (
            <p className="py-2 text-sm text-[var(--color-muted)]">Carregando...</p>
          )}

          {supporterStatus === "active" && (
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              <div>
                <p className="text-sm text-[var(--color-text)]">
                  Obrigado pelo apoio! Voce pode criar e operar times na plataforma.
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Ate 5 filas abertas simultaneas por time.
                </p>
              </div>
            </div>
          )}

          {supporterStatus === "pending" && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-info)]" aria-hidden="true" />
              <div>
                <p className="text-sm text-[var(--color-text)]">Doacao em analise.</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Assim que confirmarmos o recebimento do TC, seu tier sera ativado (ate 24h).
                </p>
              </div>
            </div>
          )}

          {supporterStatus === "none" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--color-muted)]">
                Apoiadores podem criar e operar times na plataforma. A doacao e feita in-game em
                Tibia Coin — sem dinheiro real.
              </p>

              <div className="rounded-md border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[var(--color-gold)]" aria-hidden="true" />
                  <p className="text-sm font-medium text-[var(--color-gold)]">Como apoiar</p>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Transfira{" "}
                  <strong className="text-[var(--color-text)]">
                    {DONATION.teamOwnerTc} Tibia Coins
                  </strong>{" "}
                  para o personagem{" "}
                  <strong className="text-[var(--color-text)]">{DONATION.character}</strong> in-game
                  e clique em &quot;Ja fiz a doacao&quot;.
                </p>
              </div>

              {donationSent ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-info)]">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Doacao registrada — aguardando confirmacao.
                </div>
              ) : (
                <form
                  onSubmit={(e) => void handleRequestDonation(e)}
                  className="flex flex-col gap-3"
                >
                  <Input
                    label="Nome do personagem que enviou (opcional)"
                    value={donationNote}
                    onChange={(e) => setDonationNote(e.target.value)}
                    placeholder={`Ex.: ${DONATION.character}`}
                    disabled={donationLoading}
                    hint="Ajuda o admin a localizar a transferencia."
                  />

                  {donationError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 text-sm text-[var(--color-danger)]"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {donationError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    size="sm"
                    disabled={donationLoading}
                    className="self-start"
                  >
                    {donationLoading ? "Registrando..." : "Ja fiz a doacao"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personagens */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Meus personagens</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Adicionar personagem */}
          <form
            onSubmit={(e) => void handleAddCharacter(e)}
            className="flex gap-2 mb-4"
          >
            <div className="flex-1">
              <Input
                placeholder="Nome do personagem (ex.: Galvao Swords)"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                disabled={addLoading}
                aria-label="Nome do personagem para adicionar"
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              size="md"
              disabled={addLoading || !charName.trim()}
              aria-label="Adicionar personagem"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </form>

          {addError && (
            <div role="alert" className="mb-3 flex items-start gap-2 text-sm text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {addError}
            </div>
          )}
          {addSuccess && (
            <div role="status" className="mb-3 flex items-center gap-2 text-sm text-[var(--color-success)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {addSuccess}
            </div>
          )}

          {/* Lista */}
          {listLoading ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Carregando personagens...
            </p>
          ) : characters.length === 0 ? (
            <EmptyCharacters />
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Lista de personagens">
              {characters.map((char) => (
                <li
                  key={char.id}
                  className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{char.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {char.world} · Lv {char.level}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <VocationBadge voc={char.vocation} />
                    <Badge tone="success" aria-label="Personagem validado">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      Validado
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Info adicional */}
      <p className="text-center text-xs text-[var(--color-muted)]">
        Personagens sao validados automaticamente via TibiaData. Apenas vocacoes promovidas sao
        aceitas.
      </p>
    </main>
  );
}

function EmptyCharacters() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <UserCircle className="h-10 w-10 text-[var(--color-muted)]" aria-hidden="true" />
      <p className="text-sm text-[var(--color-muted)]">Nenhum personagem adicionado ainda.</p>
      <p className="text-xs text-[var(--color-muted)]">
        Adicione seu personagem para se inscrever nas filas mais rapido.
      </p>
    </div>
  );
}

function SupporterBadge({ status }: { status: SupporterStatus | "loading" }) {
  if (status === "loading") return null;
  if (status === "active") {
    return (
      <Badge tone="gold" aria-label="Apoiador ativo">
        <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
        Apoiador
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge tone="info" aria-label="Doacao em analise">
        <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
        Pendente
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" aria-label="Nao e apoiador">
      Nao-apoiador
    </Badge>
  );
}

const VOC_TONE = {
  EK: "danger",
  RP: "success",
  ED: "info",
  MS: "neutral",
  EM: "gold",
} as const;

function VocationBadge({ voc }: { voc: string }) {
  const tone = VOC_TONE[voc as keyof typeof VOC_TONE] ?? "neutral";
  return (
    <Badge tone={tone} aria-label={`Vocacao: ${VOC_LABELS[voc] ?? voc}`}>
      {voc}
    </Badge>
  );
}
