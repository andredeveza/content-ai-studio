import { redirect } from "next/navigation";
import { createClient } from "@/infra/db/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, org_id, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-(--chrome-bg) p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Logado como</p>
        <p className="text-lg font-medium">{profile?.email ?? user.email}</p>
        <p className="text-xs text-muted-foreground">org_id: {profile?.org_id}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </div>
  );
}
