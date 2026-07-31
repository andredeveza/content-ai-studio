"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { signIn, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em]">Entrar</h1>
      <p className="mt-1.5 text-sm text-(--chrome-muted)">Acesse o studio da sua conta.</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-(--chrome-faint)" />
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-10 pl-8" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-(--chrome-faint)" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-10 pl-8"
            />
          </div>
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="mt-2 h-10">
          {pending ? "Entrando..." : "Entrar"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-(--chrome-muted)">
        Não tem conta?{" "}
        <Link href="/signup" className="font-medium text-(--chrome-ink) underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
