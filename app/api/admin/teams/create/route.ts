import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();

  const seasonId = String(formData.get("seasonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#1f7a4d");

  if (!seasonId || !name) {
    redirect("/admin/teams");
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      season_id: seasonId,
      name,
      color,
    })
    .select("id")
    .single();

  if (error || !team) {
    redirect("/admin/teams");
  }

  redirect(`/admin/teams/${team.id}`);
}