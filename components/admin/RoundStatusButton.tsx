"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoundStatusButton({
  roundId,
  status,
  label,
}: {
  roundId: string;
  status: string;
  label: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus() {
    setIsSaving(true);

    await fetch("/api/admin/rounds/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roundId, status }),
    });

    router.refresh();
    setIsSaving(false);
  }

  return (
    <button
      type="button"
      onClick={updateStatus}
      disabled={isSaving}
      className="rounded-xl border border-danvers-border px-3 py-2 text-xs font-black text-danvers-muted hover:border-danvers-green hover:text-danvers-text disabled:opacity-50"
    >
      {isSaving ? "Saving..." : label}
    </button>
  );
}