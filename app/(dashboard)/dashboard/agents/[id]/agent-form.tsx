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
    cloudPhoneNumberId: string;
    cloudTokenConfigured: boolean;
  };
};

export function AgentConfigForm({ agentId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [status, setStatus] = useState(initial.status);
  const [cloudPhoneNumberId, setCloudPhoneNumberId] = useState(initial.cloudPhoneNumberId);
  const [cloudAccessToken, setCloudAccessToken] = useState("");
  const [tokenConfigured, setTokenConfigured] = useState(initial.cloudTokenConfigured);
  const [disconnectWhatsApp, setDisconnectWhatsApp] = useState(false);
  const [tarifs, setTarifs] = useState(initial.quickReplies.tarifs || "");
  const [inscription, setInscription] = useState(initial.quickReplies.inscription || "");
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
          cloudPhoneNumberId,
          cloudAccessToken,
          disconnectWhatsApp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Erreur");
        return;
      }
      if (disconnectWhatsApp) {
        setTokenConfigured(false);
        setCloudPhoneNumberId("");
        setStatus("draft");
        setDisconnectWhatsApp(false);
      } else if (cloudAccessToken.trim()) {
        setTokenConfigured(true);
      }
      setCloudAccessToken("");
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
        <label className="label" htmlFor="agent-name">Nom de l'agent</label>
        <input id="agent-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="agent-prompt">Prompt système</label>
        <textarea
          id="agent-prompt"
          className="input min-h-[140px] font-mono text-[13px] leading-relaxed"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
        />
        <p className="mt-1 text-xs text-slate-400">Définit le rôle. Ne collez jamais de secrets ici.</p>
      </div>

      <section className="rounded-xl border border-slate-200 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Connexion WhatsApp Cloud API</h2>
          <p className="mt-1 text-xs text-slate-500">
            Le jeton est chiffré côté serveur. Il n'est jamais réaffiché après enregistrement.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="phone-number-id">Phone Number ID Meta</label>
          <input
            id="phone-number-id"
            className="input font-mono"
            inputMode="numeric"
            autoComplete="off"
            value={cloudPhoneNumberId}
            onChange={(e) => setCloudPhoneNumberId(e.target.value)}
            placeholder="Ex. 123456789012345"
            disabled={disconnectWhatsApp}
          />
        </div>
        <div>
          <label className="label" htmlFor="cloud-token">Jeton d'accès permanent</label>
          <input
            id="cloud-token"
            type="password"
            className="input font-mono"
            autoComplete="new-password"
            value={cloudAccessToken}
            onChange={(e) => setCloudAccessToken(e.target.value)}
            placeholder={tokenConfigured ? "Déjà enregistré — laisser vide pour le conserver" : "Coller le jeton Meta"}
            disabled={disconnectWhatsApp}
          />
          <p className="mt-1 text-xs text-slate-500">
            État : {tokenConfigured ? "jeton enregistré" : "aucun jeton enregistré"}.
            {tokenConfigured ? " Pour le remplacer, saisissez-en un nouveau." : ""}
          </p>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={disconnectWhatsApp}
            onChange={(e) => setDisconnectWhatsApp(e.target.checked)}
            className="mt-0.5"
          />
          Déconnecter ce numéro et supprimer le jeton chiffré
        </label>
      </section>

      <div>
        <label className="label" htmlFor="agent-status">Statut</label>
        <select id="agent-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
        </select>
        <p className="mt-1 text-xs text-slate-400">L'activation est refusée si la connexion Cloud API n'est pas configurée.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800">Réponses rapides</legend>
        {([
          ["!tarifs", tarifs, setTarifs],
          ["!inscription", inscription, setInscription],
          ["!contact", contact, setContact],
        ] as const).map(([label, val, set]) => (
          <div key={label}>
            <label className="text-xs text-slate-500 font-mono">{label}</label>
            <textarea className="input mt-1" rows={2} value={val} onChange={(e) => set(e.target.value)} />
          </div>
        ))}
      </fieldset>

      {msg && (
        <p className={`text-sm ${msg === "Enregistré" ? "text-emerald-700" : "text-red-700"}`} role="status">
          {msg}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
