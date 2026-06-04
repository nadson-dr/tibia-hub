import { redirect } from "next/navigation";
import type { TeamDoc, OfferingDoc, SignupDoc, WithId, SupporterStatus } from "@/types";
import { TeamDashboard } from "@/components/team/team-dashboard";

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  try {
    const { getCurrentUser } = await import("@/lib/auth/current-user");
    return getCurrentUser();
  } catch (err) {
    console.error("[p/[slug]] getCurrentUser falhou:", err);
    return null;
  }
}

async function getTeam(slug: string): Promise<WithId<TeamDoc> | null> {
  try {
    const { getTeamBySlug } = await import("@/lib/db/teams");
    return await getTeamBySlug(slug);
  } catch (err) {
    console.error("[p/[slug]] getTeam falhou:", err);
    return null;
  }
}

async function getOfferings(teamId: string): Promise<WithId<OfferingDoc>[]> {
  try {
    const { listOfferingsByTeam } = await import("@/lib/db/offerings");
    return await listOfferingsByTeam(teamId);
  } catch (err) {
    console.error("[p/[slug]] getOfferings falhou:", err);
    return [];
  }
}

async function getSignups(offeringIds: string[]): Promise<WithId<SignupDoc>[]> {
  try {
    const { listSignupsByOfferings } = await import("@/lib/db/signups");
    return await listSignupsByOfferings(offeringIds);
  } catch (err) {
    console.error("[p/[slug]] getSignups falhou:", err);
    return [];
  }
}

async function getSupporterStatus(): Promise<SupporterStatus> {
  try {
    const { getMySupporterStatus } = await import("@/server/actions/donations");
    return await getMySupporterStatus();
  } catch {
    return "active"; // fallback conservador: nao bloqueia dashboard de quem ja tem time
  }
}

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const team = await getTeam(slug);
  if (!team) {
    redirect("/service");
  }

  if (team.ownerUid !== user.uid) {
    redirect("/");
  }

  const [offerings, supporterStatus] = await Promise.all([
    getOfferings(team.id),
    getSupporterStatus(),
  ]);

  const offeringIds = offerings.map((o) => o.id);
  const signups = offeringIds.length > 0 ? await getSignups(offeringIds) : [];

  return (
    <TeamDashboard
      team={team}
      offerings={offerings}
      signups={signups}
      supporterStatus={supporterStatus}
    />
  );
}
