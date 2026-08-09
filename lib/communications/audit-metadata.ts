import type {
  CommunicationDeliveryResult,
  EmailCommunicationRequest,
} from "@/lib/communications/contracts";
import {
  communicationPurposes,
  type CommunicationPurpose,
} from "@/lib/communications/purpose-policy";

const SAFE_REFERENCE = /^[a-zA-Z0-9:_-]{16,160}$/;
const SAFE_USER_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export type CommunicationAuditMetadata = {
  purpose: CommunicationPurpose | "UNKNOWN";
  status: CommunicationDeliveryResult["status"];
  reasonCode: CommunicationDeliveryResult["code"];
  internalUserId: string;
  idempotencyReference: string;
  occurredAt: string;
};

export function createCommunicationAuditMetadata(
  request: EmailCommunicationRequest,
  result: CommunicationDeliveryResult,
  occurredAt = new Date(),
): CommunicationAuditMetadata {
  const purpose = typeof request.purpose === "string"
    && communicationPurposes.includes(request.purpose as CommunicationPurpose)
    ? request.purpose as CommunicationPurpose
    : "UNKNOWN";
  return {
    purpose,
    status: result.status,
    reasonCode: result.code,
    internalUserId: SAFE_USER_ID.test(request.userId) ? request.userId : "INVALID",
    idempotencyReference: SAFE_REFERENCE.test(request.idempotencyKey) ? request.idempotencyKey : "INVALID",
    occurredAt: occurredAt.toISOString(),
  };
}
