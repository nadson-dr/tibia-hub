/**
 * Tipos compartilhados — contrato entre front e back.
 * Espelham o modelo Firestore de spec/02-data-model.md. Fonte única; não redefinir localmente.
 */

/** Vocações promovidas. Ver lib/tibiadata/vocation.ts para o parse a partir da TibiaData. */
export type TibiaVocation = "EK" | "RP" | "ED" | "MS" | "EM";

export type UserRole = "player" | "team_owner";

export type Contact = {
  whatsapp?: string; // E.164, ex. "+5511999999999"
  instagram?: string; // handle sem @
};

export type QuestCode = "soulwar" | "primal_ordeal" | "rotten_blood" | (string & {});

export type OfferingKind = "service" | "community";
export type OfferingStatus = "open" | "paused" | "closed";
export type SignupStatus = "waiting" | "scheduled" | "done" | "cancelled";

/** Status do tier Apoiador (doação em TC). Ver src/config/donation.ts e ADR-010. */
export type SupporterStatus = "none" | "pending" | "active";

export type UserDoc = {
  role: UserRole;
  displayName: string;
  email: string;
  contact: Contact;
  /** tier Apoiador; ausência = "none" (compat com docs antigos) */
  supporter?: SupporterStatus;
  supporterConfirmedAt?: number;
  createdAt: number; // epoch ms (Timestamp.toMillis no client)
};

export type DonationPurpose = "team_owner";
export type DonationStatus = "pending" | "confirmed" | "rejected";

export type DonationDoc = {
  uid: string;
  userEmail: string;
  purpose: DonationPurpose;
  tcAmount: number;
  status: DonationStatus;
  note?: string; // ex.: nome do char que enviou o TC
  requestedAt: number;
  confirmedAt?: number;
  confirmedByUid?: string;
};

export type CharacterDoc = {
  name: string;
  world: string;
  vocation: TibiaVocation;
  level: number;
  validatedAt: number;
};

export type TeamDoc = {
  slug: string;
  name: string;
  ownerUid: string;
  worlds: string[];
  approved: boolean;
  supporterBadge: boolean;
  description?: string;
  createdAt: number;
};

export type TeamMemberDoc = {
  characterName: string;
  vocation: TibiaVocation;
  role: "owner" | "carry";
  active: boolean;
};

export type OfferingDoc = {
  teamId: string;
  teamSlug: string;
  quest: QuestCode;
  world: string;
  vocationSlots: Partial<Record<TibiaVocation, number>>;
  kind: OfferingKind;
  status: OfferingStatus;
  createdAt: number;
};

export type SignupDoc = {
  offeringId: string;
  teamId: string;
  clientUid: string;
  characterName: string;
  vocation: TibiaVocation;
  level: number;
  world: string;
  contact: Contact;
  source?: string;
  status: SignupStatus;
  queueOrder: number;
  createdAt: number;
};

/** Result discriminável para I/O que pode falhar (ver spec/08-conventions.md). */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

/* ─────────────────────────────────────────────────────────────────────────────
 * Contrato de autenticação e server actions (Fase 1 — slice 1).
 * Costura front/back: o client faz sign-in com o Firebase Web SDK, obtém o ID
 * token e POSTa em `/api/auth/session` para o servidor criar um cookie httpOnly
 * de sessão. A partir daí, Server Components e server actions descobrem o usuário
 * via `getCurrentUser()` (lê o cookie) — o client NÃO passa token nas actions.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Usuário autenticado resolvido no servidor a partir do cookie de sessão. */
export type SessionUser = {
  uid: string;
  email: string | null;
};

/** Documento de usuário + id (para hidratar UI). */
export type WithId<T> = T & { id: string };

export type TeamOnboardingInput = {
  name: string;
  slug: string;
  worlds: string[];
  description?: string;
  contact: Contact;
  /** personagem do dono que vira o primeiro membro (owner) */
  ownerCharacterName: string;
};

export type AddCharacterInput = {
  name: string; // será validado na TibiaData (mundo/vocação/level vêm de lá)
};

export type CreateOfferingInput = {
  teamId: string;
  quest: QuestCode;
  world: string;
  vocationSlots: Partial<Record<TibiaVocation, number>>;
  kind?: OfferingKind; // default "service"
};

export type CreateSignupInput = {
  offeringId: string;
  characterName: string; // validado na TibiaData contra o mundo da oferta
  contact: Contact;
  source?: string;
};

export type UpdateSignupStatusInput = {
  signupId: string;
  status: SignupStatus;
};

/* ── Doação / Apoiador (ADR-010) ─────────────────────────────────────────── */

/** Usuário declara que doou TC para virar Apoiador (pendente até admin confirmar). */
export type RequestDonationInput = {
  purpose: DonationPurpose; // "team_owner"
  /** nome do char que enviou o TC, p/ o admin conferir (opcional) */
  note?: string;
};

/** Admin confirma/rejeita uma doação. */
export type ResolveDonationInput = {
  donationId: string;
  decision: "confirm" | "reject";
};
