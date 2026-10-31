"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  agentId: string;
  initial: {
    name: string;
    systemPrompt: string;
    status: string;
    quickReplies: Record<string, string>;
  };
};

export function AgentConfigForm({ agentId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [status, setStatus] = useState(initial.status);
  const [tarifs, setTarifs] = useState(initial.quickReplies.tarifs || "");
  const [inscription, setInscription] = useState(
    initial.quickReplies.inscription || ""
  );
  const [contact, setContact] = useState(initial.quickReplies.contact || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          systemPrompt,
          status,
          quickReplies: { tarifs, inscription, contact },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.error || "Erreur");
        return;
      }
      setMsg("Enregistré");
      router.refresh();
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-5">
      <div>
        <label className="label">Nom de l'agent</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="label">Prompt système</label>
        <textarea
          className="input min-h-[140px] font-mono text-[13px] leading-relaxed"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
        />
        <p className="mt-1 text-xs text-slate-400">
          Définit le rôle. Ne collez jamais de secrets ici.
        </p>
      </div>

      <div>
        <label className="label">Statut</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
        </select>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800">Réponses rapides</legend>
        {(
          [
            ["!tarifs", tarifs, setTarifs],
            ["!inscription", inscription, setInscription],
            ["!contact", contact, setContact],
          ] as const
        ).map(([label, val, set]) => (
          <div key={label}>
            <label className="text-xs text-slate-500 font-mono">{label}</label>
            <textarea
              className="input mt-1"
              rows={2}
              value={val}
              onChange={(e) => set(e.target.value)}
            />
          </div>
        ))}
      </fieldset>

      {msg && (
        <p
          className={`text-sm ${msg === "Enregistré" ? "text-emerald-700" : "text-red-700"}`}
        >
          {msg}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
