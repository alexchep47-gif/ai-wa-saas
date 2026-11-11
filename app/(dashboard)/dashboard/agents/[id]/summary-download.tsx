"use client";

export function SummaryDownload({ agentId }: { agentId: string }) {
  return (
    <a
      href={`/api/agents/${agentId}/summary`}
      className="btn-secondary inline-flex items-center"
      download
    >
      Télécharger la synthèse PDF
    </a>
  );
}
