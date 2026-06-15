"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteResultButton({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteResult() {
    const confirmed = window.confirm("Delete this official result?");
    if (!confirmed) return;

    setIsDeleting(true);

    await fetch("/api/admin/results/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resultId }),
    });

    router.refresh();
    setIsDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={deleteResult}
      disabled={isDeleting}
      className="mt-3 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}