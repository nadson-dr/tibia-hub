import { notFound } from "next/navigation";
import { Shield } from "lucide-react";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { DonationDoc, TeamDoc, WithId } from "@/types";

export const dynamic = "force-dynamic";

async function checkAdmin(): Promise<boolean> {
  try {
    const { isCurrentUserAdmin } = await import("@/lib/auth/current-user");
    return await isCurrentUserAdmin();
  } catch {
    return false;
  }
}

async function getPendingDonations(): Promise<WithId<DonationDoc>[]> {
  try {
    const { listPendingDonations } = await import("@/server/actions/admin");
    return await listPendingDonations();
  } catch {
    return [];
  }
}

async function getPendingTeams(): Promise<WithId<TeamDoc>[]> {
  try {
    const { listPendingTeams } = await import("@/server/actions/admin");
    return await listPendingTeams();
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    notFound();
  }

  const [donations, teams] = await Promise.all([
    getPendingDonations(),
    getPendingTeams(),
  ]);

  const totalPending = donations.length + teams.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-[var(--color-gold)]" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold)]">
              Area restrita
            </p>
            <h1 className="font-display text-3xl text-[var(--color-text)]">Painel Admin</h1>
          </div>
        </div>
        {totalPending > 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {totalPending} {totalPending === 1 ? "item pendente" : "itens pendentes"} aguardando
            revisao.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Tudo em dia. Nenhum item pendente.
          </p>
        )}
      </div>

      <AdminPanel initialDonations={donations} initialTeams={teams} />
    </main>
  );
}
