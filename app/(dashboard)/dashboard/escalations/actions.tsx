"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EscalationActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve(status: "approved" | "rejected") {
    setLoading(true);
    try {
      await fetch(`/api/escalations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => resolve("approved")}
        className="btn-primary !py-1.5 !px-3 !text-xs"
      >
        Approuver
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => resolve("rejected")}
        className="btn-secondary !py-1.5 !px-3 !text-xs"
      >
        Refuser
      </button>
    </div>
  );
}
