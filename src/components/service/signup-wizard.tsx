"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OfferingDoc, WithId } from "@/types";

type Step = "character" | "contact" | "done";

const SOURCE_OPTIONS = [
  { value: "twitch", label: "Twitch/YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação de amigo" },
  { value: "discord", label: "Discord" },
  { value: "outro", label: "Outro" },
];

type Props = {
  offering: WithId<OfferingDoc>;
  teamSlug: string;
};

export function SignupWizard({ offering, teamSlug }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("character");

  // Passo 1 — personagem
  const [charName, setCharName] = useState("");
  const [confirmedChar, setConfirmedChar] = useState<string | null>(null);

  // Passo 2 — contato
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [source, setSource] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCharConfirm = (e: FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;
    setConfirmedChar(charName.trim());
    setStep("contact");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmedChar) return;

    if (!whatsapp.trim() && !instagram.trim()) {
      setContactError("Informe pelo menos um contato (WhatsApp ou Instagram).");
      return;
    }

    setContactError(null);
    setSubmitError(null);
    setSubmitLoading(true);

    try {
      const { createSignup } = await import("@/server/actions/signups");
      const result = await createSignup({
        offeringId: offering.id,
        characterName: confirmedChar,
        contact: {
          whatsapp: whatsapp.trim() || undefined,
          instagram: instagram.trim() || undefined,
        },
        source: source || undefined,
      });

      if (!result.ok) {
        // Se o erro é sobre o personagem, volta para o passo 1
        const charErrors = [
          "não encontrado",
          "mundo",
          "vocação",
          "Personagem",
        ];
        const isCharError = charErrors.some((kw) =>
          result.error?.toLowerCase().includes(kw.toLowerCase()),
        );
        if (isCharError) {
          setStep("character");
          setConfirmedChar(null);
          setSubmitError(result.error ?? "Erro ao validar personagem.");
        } else {
          setSubmitError(result.error ?? "Erro ao entrar na fila.");
        }
      } else {
        setStep("done");
      }
    } catch {
      setSubmitError("Erro ao enviar inscrição. Tente novamente.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2
            className="h-12 w-12 text-[var(--color-success)]"
            aria-hidden="true"
          />
          <div>
            <p className="font-display text-lg text-[var(--color-text)]">
              Você está na fila!
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              <strong className="text-[var(--color-text)]">{confirmedChar}</strong> entrou
              na fila de {offering.world}.
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              O time entrará em contato para combinar o horário.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/g/${teamSlug}`)}
          >
            Voltar para a página do time
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Indicador de passos */}
      <nav
        aria-label="Passos da inscrição"
        className="flex items-center justify-center gap-2"
      >
        <StepIndicator
          number={1}
          label="Personagem"
          active={step === "character"}
          done={step === "contact"}
        />
        <ChevronRight
          className="h-4 w-4 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <StepIndicator
          number={2}
          label="Contato"
          active={step === "contact"}
          done={false}
        />
      </nav>

      <Card>
        {step === "character" ? (
          <>
            <CardHeader>
              <CardTitle>Qual é o seu personagem?</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCharConfirm}
                className="flex flex-col gap-4"
              >
                <Input
                  label="Nome do personagem"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="Ex.: Galvao Swords"
                  hint={`Personagem no mundo ${offering.world} — validado na hora.`}
                  required
                />

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={!charName.trim()}
                >
                  Continuar
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Como o time fala com você?</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resumo do personagem confirmado */}
              {confirmedChar && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[var(--color-success)]"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-[var(--color-text)]">{confirmedChar}</span>
                  <span className="ml-auto text-xs text-[var(--color-muted)]">
                    {offering.world}
                  </span>
                </div>
              )}

              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="flex flex-col gap-4"
              >
                <Input
                  label="WhatsApp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+5511999999999"
                  disabled={submitLoading}
                  hint="O time vai combinar o horário por aqui"
                />
                <Input
                  label="Instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="seuperfil"
                  disabled={submitLoading}
                  hint="Handle sem @"
                />

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="source"
                    className="text-sm font-medium text-[var(--color-text)]"
                  >
                    Como nos conheceu?{" "}
                    <span className="font-normal text-[var(--color-muted)]">(opcional)</span>
                  </label>
                  <select
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    disabled={submitLoading}
                    className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                  >
                    <option value="">Selecione (opcional)</option>
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {contactError && (
                  <p role="alert" className="text-sm text-[var(--color-danger)]">
                    {contactError}
                  </p>
                )}
                {submitError && (
                  <p role="alert" className="text-sm text-[var(--color-danger)]">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("character");
                      setSubmitError(null);
                    }}
                    disabled={submitLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    className="flex-1"
                    disabled={submitLoading}
                  >
                    {submitLoading ? "Entrando na fila..." : "Entrar na fila"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
          active
            ? "bg-[var(--color-gold)] text-[var(--color-bg)]"
            : done
              ? "bg-[var(--color-success)] text-[var(--color-bg)]"
              : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
        )}
        aria-current={active ? "step" : undefined}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : number}
      </span>
      <span
        className={cn(
          "text-sm",
          active
            ? "text-[var(--color-text)]"
            : done
              ? "text-[var(--color-success)]"
              : "text-[var(--color-muted)]",
        )}
      >
        {label}
      </span>
    </div>
  );
}
