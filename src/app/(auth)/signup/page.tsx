"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, User } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccountType = "client" | "team_owner" | null;

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountType) {
      setError("Selecione o tipo de conta antes de continuar.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUpWithEmail(email, password);

      // Chama ensureUserDoc para criar o documento do usuário no Firestore.
      // Importado dinamicamente para não quebrar se o backend ainda não existe.
      try {
        const { ensureUserDoc } = await import("@/server/actions/users");
        await ensureUserDoc({ role: accountType === "team_owner" ? "team_owner" : "player" });
      } catch {
        // Se a action ainda não existe, ignora (o orchestrator liga depois)
      }

      if (accountType === "team_owner") {
        router.push("/signup/team");
      } else {
        router.push("/me");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Criar conta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-[var(--color-text)]">
          {/* Seleção de tipo */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-[var(--color-text)]">
              Você é...
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <AccountTypeCard
                selected={accountType === "client"}
                onClick={() => setAccountType("client")}
                icon={<User className="h-6 w-6" />}
                title="Sou cliente"
                description="Quero contratar quests com times profissionais"
              />
              <AccountTypeCard
                selected={accountType === "team_owner"}
                onClick={() => setAccountType("team_owner")}
                icon={<Users className="h-6 w-6" />}
                title="Tenho um time"
                description="Quero gerenciar meu time de service"
              />
            </div>
          </fieldset>

          {/* Formulário */}
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              hint="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
            />

            {error && (
              <p role="alert" className="text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="gold"
              className="w-full mt-1"
              disabled={loading || !accountType}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-muted)]">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="text-[var(--color-gold)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function AccountTypeCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
        selected
          ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text)]",
      )}
      aria-pressed={selected}
    >
      {icon}
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs leading-snug opacity-80">{description}</span>
    </button>
  );
}
