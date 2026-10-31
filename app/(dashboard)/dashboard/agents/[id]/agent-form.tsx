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
    <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Nom de l'agent</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Prompt système (rôle de l'agent)
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Statut</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
        </select>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Réponses rapides</legend>
        <div>
          <label className="text-xs text-slate-500">!tarifs</label>
          <textarea
            value={tarifs}
            onChange={(e) => setTarifs(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">!inscription</label>
          <textarea
            value={inscription}
            onChange={(e) => setInscription(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">!contact</label>
          <textarea
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      {msg && (
        <p
          className={`text-sm ${msg === "Enregistré" ? "text-green-600" : "text-red-600"}`}
        >
          {msg}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
