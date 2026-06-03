import Link from "next/link";
import { Swords, Timer, Calculator, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tool = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "live" | "soon";
};

const tools: Tool[] = [
  {
    title: "Service de Quests",
    description:
      "Encontre um time, valide seu personagem na hora e entre na fila — sem planilha, sem typo.",
    href: "/service",
    icon: Swords,
    status: "live",
  },
  {
    title: "Boss Timers",
    description: "Janelas de respawn de bosses com reports da comunidade.",
    href: "/bosses",
    icon: Timer,
    status: "soon",
  },
  {
    title: "Calculadoras",
    description: "XP, magic level, skill, dano, charms — números fiéis ao jogo.",
    href: "/tools",
    icon: Calculator,
    status: "soon",
  },
  {
    title: "Lore & Books",
    description: "Cosmologia, raças e o acervo de livros in-game de Tibia.",
    href: "/lore",
    icon: BookOpen,
    status: "soon",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-14 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--color-gold)]">
          Fansite de Tibia · grátis para a comunidade
        </p>
        <h1 className="font-display text-4xl text-[var(--color-text)] sm:text-5xl">
          Tibia Hub
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted)]">
          Ferramentas para jogadores e times de service. Comece organizando a fila do seu time de
          quests — o resto do hub vem a caminho.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/service"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--color-gold)] px-6 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-amber)]"
          >
            Ver times de service
          </Link>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const card = (
            <Card className="h-full transition-colors hover:border-[var(--color-gold)]/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-[var(--color-gold)]" />
                  {tool.status === "soon" ? (
                    <Badge tone="neutral">Em breve</Badge>
                  ) : (
                    <Badge tone="gold">Disponível</Badge>
                  )}
                </div>
                <CardTitle>{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>{tool.description}</CardContent>
            </Card>
          );

          return tool.status === "live" ? (
            <Link key={tool.title} href={tool.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={tool.title} className="cursor-default opacity-80">
              {card}
            </div>
          );
        })}
      </section>

      <footer className="mt-16 text-center text-xs text-[var(--color-muted)]">
        <p>
          Tibia Hub é um fansite não-oficial. Tibia é marca registrada da CipSoft GmbH. Todas as
          ferramentas são gratuitas.
        </p>
      </footer>
    </main>
  );
}
