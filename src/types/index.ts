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

export type UserDoc = {
  role: UserRole;
  displayName: string;
  email: string;
  contact: Contact;
  createdAt: number; // epoch ms (Timestamp.toMillis no client)
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
