"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

export function Header() {
  const { user, loading, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg text-[var(--color-gold)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded"
        >
          <Swords className="h-5 w-5" aria-hidden="true" />
          Tibia Hub
        </Link>

        {/* Nav central */}
        <nav aria-label="Navegação principal">
          <ul className="hidden sm:flex items-center gap-6 text-sm text-[var(--color-muted)]">
            <li>
              <Link
                href="/service"
                className="transition-colors hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] rounded px-1"
              >
                Service
              </Link>
            </li>
          </ul>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-[var(--color-muted)]">...</span>
          ) : user ? (
            <>
              <span
                className="hidden sm:block max-w-[140px] truncate text-sm text-[var(--color-text)]"
                title={user.displayName ?? user.email ?? ""}
              >
                {user.displayName ?? user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void signOutUser()}
              >
                Sair
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="gold" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
