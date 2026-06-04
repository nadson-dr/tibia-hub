"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamOnboardingInput, SupporterStatus } from "@/types";
import { DONATION } from "@/config/donation";

// Worlds list — carregado dinamicamente no client a partir da TibiaData
const FALLBACK_WORLDS = [
  "Antica", "Astera", "Bona", "Calmera", "Carnera", "Castela", "Celebra",
  "Collabra", "Descubra", "Dibra", "Dolera", "Fera", "Firmera", "Garnera",
  "Gladera", "Harmonia", "Havera", "Helera", "Honbra", "Ignitera", "Illusera",
  "Impulsa", "Inabra", "Isara", "Javibra", "Julera", "Karna", "Kenora",
  "Lobera", "Luminera", "Lutabra", "Madora", "Marcelona", "Menera", "Mitigera",
  "Monza", "Mudabra", "Nefera", "Nika", "Nossobra", "Ocera", "Olera", "Ombra",
  "Ondebra", "Optera", "Pabera", "Peloria", "Premia", "Quelibra", "Quintera",
  "Refugia", "Relembra", "Retalia", "Runera", "Secura", "Serdebra", "Solidera",
  "Talera", "Thyria", "Torpera", "Tortura", "Trimera", "Unica", "Utobra",
  "Venebra", "Vetera", "Visabra", "Vunira", "Wadalbra", "Wizera", "Xandebra",
  "Xylabra", "Zanera", "Zeluna",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function TeamOnboardingPage() {
  const router = useRouter();

  const [status, setStatus] = useState<SupporterStatus | "loading">("loading");
  const [donationNote, setDonationNote] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSent, setDonationSent] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [worlds, setWorlds] = useState<string[]>([]);
  const [worldSearch, setWorldSearch] = useState("");
  const [ownerCharacterName, setOwnerCharacterName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Carrega o status de apoiador ao montar
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { getMySupporterStatus } = await import("@/server/actions/donations");
        const s = await getMySupporterStatus();
        if (active) setStatus(s);
      } catch {
        if (active) setStatus("none");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Auto-slug a partir do nome
  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  const toggleWorld = (world: string) => {
    setWorlds((prev) =>
      prev.includes(world) ? prev.filter((w) => w !== world) : [...prev, world],
    );
  };

  const filteredWorlds = FALLBACK_WORLDS.filter((w) =>
    w.toLowerCase().includes(worldSearch.toLowerCase()),
  );

  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!name.trim()) errs.name = "Nome do time é obrigatório.";
    if (!slug.trim()) errs.slug = "Slug é obrigatório.";
    else if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = "Use apenas letras minúsculas, números e hífens.";
    if (worlds.length === 0) errs.worlds = "Selecione pelo menos um mundo.";
    if (!ownerCharacterName.trim()) errs.ownerCharacterName = "Nome do personagem é obrigatório.";
    if (!whatsapp.trim() && !instagram.trim()) errs.contact = "Informe pelo menos um contato.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const input: TeamOnboardingInput = {
        name: name.trim(),
        slug: slug.trim(),
        worlds,
        description: description.trim() || undefined,
        contact: {
          whatsapp: whatsapp.trim() || undefined,
          instagram: instagram.trim() || undefined,
        },
        ownerCharacterName: ownerCharacterName.trim(),
      };

      const { createTeam } = await import("@/server/actions/teams");
      const result = await createTeam(input);

      if (!result.ok) {
        setSubmitError(result.error ?? "Erro ao criar time.");
        return;
      }

      router.push(`/p/${result.value.slug}`);
    } catch {
      setSubmitError("Erro ao criar time. Tente novamente.");
    } finally {
      setLoading(false);
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
        setDonationError(result.error ?? "Erro ao registrar doação.");
      } else {
        setDonationSent(true);
        setStatus("pending");
      }
    } catch {
      setDonationError("Erro ao registrar doação. Tente novamente.");
    } finally {
      setDonationLoading(false);
    }
  };

  // Estado de carregamento inicial
  if (status === "loading") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <p className="text-center text-sm text-[var(--color-muted)]">Verificando seu status...</p>
      </main>
    );
  }

  // Estado: pendente
  if (status === "pending") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-8 text-center">
          <p className="mb-1 text-sm uppercase tracking-widest text-[var(--color-gold)]">
            Cadastro de time
          </p>
          <h1 className="font-display text-3xl text-[var(--color-text)]">Aguardando confirmação</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full border border-[var(--color-info)]/30 bg-[var(--color-info)]/10 p-4">
                <Clock className="h-8 w-8 text-[var(--color-info)]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">Doacao em analise</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Assim que confirmarmos o recebimento do TC, voce podera criar seu time.
                  O processo leva ate 24h.
                </p>
              </div>
              <Badge tone="info">
                <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Estado: não é apoiador — mostra painel de doação
  if (status === "none") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-8 text-center">
          <p className="mb-1 text-sm uppercase tracking-widest text-[var(--color-gold)]">
            Cadastro de time
          </p>
          <h1 className="font-display text-3xl text-[var(--color-text)]">Seja Apoiador</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Para criar e operar um time, voce precisa ser Apoiador da plataforma.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Instruções de doação */}
            <div className="mb-6 rounded-md border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--color-gold)]" aria-hidden="true" />
                <p className="font-medium text-[var(--color-gold)]">Como se tornar Apoiador</p>
              </div>
              <ol className="flex flex-col gap-2 text-sm text-[var(--color-muted)]">
                <li className="flex gap-2">
                  <span className="shrink-0 font-medium text-[var(--color-gold)]">1.</span>
                  <span>
                    Abra o Tibia, va ate a loja in-game e transfira{" "}
                    <strong className="text-[var(--color-text)]">
                      {DONATION.teamOwnerTc} Tibia Coins
                    </strong>{" "}
                    para o personagem{" "}
                    <strong className="text-[var(--color-text)]">{DONATION.character}</strong>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-medium text-[var(--color-gold)]">2.</span>
                  <span>Volte aqui e clique em &quot;Ja fiz a doacao&quot; com o nome do personagem que enviou.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-medium text-[var(--color-gold)]">3.</span>
                  <span>
                    Nossa equipe confirma o recebimento (ate 24h) e libera o cadastro de time.
                  </span>
                </li>
              </ol>
              <p className="mt-3 text-xs text-[var(--color-muted)]">{DONATION.instructions}</p>
            </div>

            {/* Formulário de declaração de doação */}
            {donationSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Badge tone="info">
                  <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                  Doacao registrada — em analise
                </Badge>
                <p className="text-sm text-[var(--color-muted)]">
                  Confirmacao em ate 24h. Avisaremos por e-mail.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleRequestDonation(e)} className="flex flex-col gap-4">
                <Input
                  label="Nome do personagem que enviou o TC (opcional)"
                  value={donationNote}
                  onChange={(e) => setDonationNote(e.target.value)}
                  placeholder={`Ex.: ${DONATION.character}`}
                  disabled={donationLoading}
                  hint="Ajuda o admin a localizar a transferencia mais rapido."
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
                  className="w-full"
                  disabled={donationLoading}
                >
                  {donationLoading ? "Registrando..." : "Ja fiz a doacao"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  // Estado: active — mostra o formulário de cadastro de time
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm uppercase tracking-widest text-[var(--color-gold)]">
          Cadastro de time
        </p>
        <h1 className="font-display text-3xl text-[var(--color-text)]">Crie seu time</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Apos o cadastro, nossa equipe revisa e aprova em ate 24h.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            {/* Nome do time */}
            <Input
              label="Nome do time"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Besteam"
              error={errors.name}
              disabled={loading}
              required
            />

            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <Input
                label="URL do time"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="besteam"
                error={errors.slug}
                disabled={loading}
                hint={slug ? `tibiahub.gg/g/${slug}` : undefined}
              />
            </div>

            {/* Mundos */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Mundos atendidos
              </label>
              <input
                type="text"
                placeholder="Filtrar mundos..."
                value={worldSearch}
                onChange={(e) => setWorldSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                aria-label="Filtrar mundos"
              />
              <div
                className="max-h-48 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
                role="group"
                aria-label="Lista de mundos"
              >
                {filteredWorlds.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--color-muted)]">
                    Nenhum mundo encontrado.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {filteredWorlds.map((world) => {
                      const selected = worlds.includes(world);
                      return (
                        <button
                          key={world}
                          type="button"
                          onClick={() => toggleWorld(world)}
                          className={cn(
                            "flex items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
                            selected
                              ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                              : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
                          )}
                          aria-pressed={selected}
                        >
                          <Check
                            className={cn(
                              "h-3 w-3 shrink-0",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden="true"
                          />
                          {world}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {worlds.length > 0 && (
                <p className="text-xs text-[var(--color-muted)]">
                  Selecionados: {worlds.join(", ")}
                </p>
              )}
              {errors.worlds && (
                <p role="alert" className="text-xs text-[var(--color-danger)]">
                  {errors.worlds}
                </p>
              )}
            </div>

            {/* Personagem do dono */}
            <Input
              label="Seu personagem principal"
              value={ownerCharacterName}
              onChange={(e) => setOwnerCharacterName(e.target.value)}
              placeholder="Ex.: Galvao Swords"
              error={errors.ownerCharacterName}
              disabled={loading}
              hint="Nome exato como aparece no Tibia. Sera validado automaticamente."
            />

            {/* Contatos */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Contato do time
              </p>
              <Input
                label="WhatsApp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+5511999999999"
                disabled={loading}
                hint="Formato E.164 com codigo do pais"
              />
              <Input
                label="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="seutime"
                disabled={loading}
                hint="Handle sem @"
              />
              {errors.contact && (
                <p role="alert" className="text-xs text-[var(--color-danger)]">
                  {errors.contact}
                </p>
              )}
            </div>

            {/* Descricao */}
            <Textarea
              label="Descricao (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fale sobre seu time, quests que realiza, diferenciais..."
              disabled={loading}
              rows={3}
            />

            {submitError && (
              <p role="alert" className="text-sm text-[var(--color-danger)]">
                {submitError}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? "Criando time..." : "Criar time"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
