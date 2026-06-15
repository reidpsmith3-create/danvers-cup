"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAdminItemButton({
  label,
  endpoint,
  payload,
}: {
  label: string;
  endpoint: string;
  payload: Record<string, string>;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteItem() {
    const confirmed = window.confirm(`Delete this ${label}?`);
    if (!confirmed) return;

    setIsDeleting(true);

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    router.refresh();
    setIsDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={deleteItem}
      disabled={isDeleting}
      className="mt-3 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}