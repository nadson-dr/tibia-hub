/**
 * Configuração do tier "Apoiador" (doação em Tibia Coin). Ver spec/adr/010-supporter-tc-gating.md.
 *
 * AJUSTE AQUI: personagem que recebe a doação in-game, valores em TC e as capacidades por nível.
 * Reverter para "tudo grátis" (ADR-009) = liberar tudo no nível `none`.
 */

export type SupporterStatus = "none" | "pending" | "active";

/** Capacidades por status de apoiador. */
export type Caps = {
  /** pode criar/operar um time */
  canOwnTeam: boolean;
  /** número máximo de ofertas com status "open" simultâneas por time */
  maxActiveOfferings: number;
};

export const CAPS: Record<SupporterStatus, Caps> = {
  // Sem doação: não é dono de time, nenhuma fila aberta.
  none: { canOwnTeam: false, maxActiveOfferings: 0 },
  // Doação declarada, aguardando confirmação do admin — trata como ainda não habilitado.
  pending: { canOwnTeam: false, maxActiveOfferings: 0 },
  // Apoiador confirmado: dono de time + várias filas/quests simultâneas.
  active: { canOwnTeam: true, maxActiveOfferings: 5 },
};

/** Onde e quanto doar (in-game, TC). Valores placeholder — AJUSTE para o real. */
export const DONATION = {
  /** personagem da plataforma que recebe o TC in-game */
  character: "TibiaHub Donate",
  /** valor sugerido (TC) para habilitar o tier Apoiador / ser dono de time */
  teamOwnerTc: 250,
  /** instrução curta exibida ao usuário */
  instructions:
    "Transfira o valor em Tibia Coin para o personagem indicado, in-game. Após confirmarmos o recebimento, seu tier de Apoiador é ativado.",
};

export const capsFor = (status: SupporterStatus): Caps => CAPS[status] ?? CAPS.none;
