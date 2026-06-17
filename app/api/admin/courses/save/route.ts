import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Course name is required." },
      { status: 400 }
    );
  }

const payload = {
  name,
  city: String(body.city ?? "").trim() || null,
  state: String(body.state ?? "").trim() || null,
  website_url: String(body.websiteUrl ?? "").trim() || null,
  logo_url: String(body.logoUrl ?? "").trim() || null,
  hero_image_url: String(body.heroImageUrl ?? "").trim() || null,
  notes: String(body.notes ?? "").trim() || null,
};

  if (body.id) {
    const { data, error } = await supabase
      .from("courses")
      .update(payload)
      .eq("id", String(body.id))
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, courseId: data.id });
  }

  const { data, error } = await supabase
    .from("courses")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, courseId: data.id });
}