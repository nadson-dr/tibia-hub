import { notFound } from "next/navigation";
import type { TeamDoc, OfferingDoc, WithId } from "@/types";
import { SignupWizard } from "@/components/service/signup-wizard";

export const dynamic = "force-dynamic";

const QUEST_LABELS: Record<string, string> = {
  soulwar: "Soul War",
  primal_ordeal: "Primal Ordeal",
  rotten_blood: "Rotten Blood",
};

async function getOffering(offeringId: string): Promise<WithId<OfferingDoc> | null> {
  try {
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await adminDb().collection("offerings").doc(offeringId).get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<OfferingDoc, "createdAt"> & {
      createdAt: { toMillis(): number };
    };
    return { id: snap.id, ...data, createdAt: data.createdAt.toMillis() } as WithId<OfferingDoc>;
  } catch {
    return null;
  }
}

async function getTeam(slug: string): Promise<WithId<TeamDoc> | null> {
  try {
    const { getTeamBySlug } = await import("@/lib/db/teams");
    return await getTeamBySlug(slug);
  } catch {
    return null;
  }
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ slug: string; offeringId: string }>;
}) {
  const { slug, offeringId } = await params;

  const [team, offering] = await Promise.all([getTeam(slug), getOffering(offeringId)]);

  if (!team || !team.approved || !offering) {
    notFound();
  }

  if (offering.status !== "open") {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-[var(--color-text)]">Fila encerrada</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Esta fila não está mais aceitando inscrições.
          </p>
        </div>
      </main>
    );
  }

  const questLabel = QUEST_LABELS[offering.quest] ?? offering.quest;

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm uppercase tracking-widest text-[var(--color-gold)]">
          {team.name}
        </p>
        <h1 className="font-display text-2xl text-[var(--color-text)]">
          Entrar na fila — {questLabel}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Mundo: {offering.world}</p>
      </div>

      <SignupWizard offering={offering} teamSlug={slug} />
    </main>
  );
}
