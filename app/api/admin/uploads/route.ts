import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const category = formData.get("category");

    if (category !== "players" && category !== "sponsors" && category !== "teams") {
      return NextResponse.json(
        { error: "Invalid upload category." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const path = `${category}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("site-assets")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("site-assets")
      .getPublicUrl(path);

    return NextResponse.json({
      url: data.publicUrl,
    });
  } catch (error) {
    console.error("Admin image upload error:", error);

    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 }
    );
  }
}
