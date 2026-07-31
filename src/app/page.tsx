import { redirect } from "next/navigation";
import { createClient } from "@/infra/db/supabase/server";

// A partir de agora as 4 telas do dashboard existem — "/" só decide
// entre login e o app de verdade, nunca renderiza chrome próprio (o
// middleware já garante que só chega aqui gente autenticada).
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/gerador" : "/login");
}
