"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CmsProgram } from "@/lib/cms/types";

type WorkflowAction = "request-review" | "request-changes" | "approve" | "publish" | "archive";

export function ProgramWorkflowActions({
  programId,
  status,
  canReview,
  canApprove,
  canPublish,
  canArchive,
}: {
  programId: string;
  status: CmsProgram["status"];
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canArchive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<WorkflowAction | null>(null);
  const [message, setMessage] = useState("");

  async function run(action: WorkflowAction) {
    setPending(action);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/programs/${programId}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Workflow action failed");
      setMessage(`Workflow action completed: ${action}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow action failed");
    } finally {
      setPending(null);
    }
  }

  const configuredActions: Array<{ action: WorkflowAction; label: string; visible: boolean }> = [
    { action: "request-review", label: "Request review", visible: canReview && status === "DRAFT" },
    { action: "request-changes", label: "Request changes", visible: canReview && status !== "DRAFT" && status !== "ARCHIVED" },
    { action: "approve", label: "Approve", visible: canApprove && status === "IN_REVIEW" },
    { action: "publish", label: "Publish", visible: canPublish && (status === "APPROVED" || status === "SCHEDULED") },
    { action: "archive", label: "Archive", visible: canArchive && status !== "ARCHIVED" },
  ];
  const actions = configuredActions.filter((item) => item.visible);

  if (!actions.length) return null;

  return (
    <div className="builderWorkflow" aria-label="Program workflow actions">
      {actions.map(({ action, label }) => (
        <button disabled={pending !== null} key={action} onClick={() => run(action)} type="button">
          {pending === action ? `${label}…` : label}
        </button>
      ))}
      {message ? <span role="status">{message}</span> : null}
    </div>
  );
}
