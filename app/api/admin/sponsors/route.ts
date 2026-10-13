import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function validateUrl(value: unknown, required: boolean) {
  const text = String(value ?? "").trim();

  if (!text && !required) return null;
  if (!text) throw new Error("A logo URL is required.");

  try {
    const url = new URL(text);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new Error("Enter a valid HTTP or HTTPS URL.");
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const action = String(body?.action ?? "");

  if (action === "delete") {
    const id = String(body?.id ?? "");

    if (!id) {
      return NextResponse.json(
        { error: "Missing sponsor ID." },
        { status: 400 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("player_sponsors")
      .select("id", { count: "exact", head: true })
      .eq("sponsor_id", id);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Remove this sponsor from all players before deleting it." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("sponsors")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (action !== "save") {
    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 }
    );
  }

  const id = body?.id ? String(body.id) : null;
  const name = String(body?.name ?? "").trim();

  if (!name || name.length > 120) {
    return NextResponse.json(
      { error: "Sponsor name must be between 1 and 120 characters." },
      { status: 400 }
    );
  }

  let logoUrl: string | null;
  let websiteUrl: string | null;

  try {
    logoUrl = validateUrl(body?.logoUrl, true);
    websiteUrl = validateUrl(body?.websiteUrl, false);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid sponsor URL.",
      },
      { status: 400 }
    );
  }

  const values = {
    name,
    logo_url: logoUrl!,
    website_url: websiteUrl,
  };

  if (id) {
    const { error } = await supabaseAdmin
      .from("sponsors")
      .update(values)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  } else {
    const { error } = await supabaseAdmin
      .from("sponsors")
      .insert(values);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
