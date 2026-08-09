import {
  communicationTemplates,
  type CommunicationTemplate,
  type RenderedCommunication,
} from "@/lib/communications/contracts";
import type { CommunicationPurpose } from "@/lib/communications/purpose-policy";

const templatePurpose: Record<CommunicationTemplate, Exclude<CommunicationPurpose, "COMMERCIAL_MARKETING">> = {
  ACCOUNT_SECURITY_GENERIC: "ACCOUNT_SECURITY",
  PROGRAMME_USER_REQUESTED_REMINDER: "PROGRAMME_USER_REQUESTED_REMINDER",
  PROGRAMME_ENGAGEMENT_REMINDER: "PROGRAMME_ENGAGEMENT",
};

function safeTemplate(value: unknown): CommunicationTemplate | null {
  return typeof value === "string" && communicationTemplates.includes(value as CommunicationTemplate)
    ? value as CommunicationTemplate
    : null;
}

export function renderCommunicationTemplate(
  templateValue: unknown,
  purpose: Exclude<CommunicationPurpose, "COMMERCIAL_MARKETING">,
  siteUrl: string,
): RenderedCommunication | null {
  const template = safeTemplate(templateValue);
  if (!template || templatePurpose[template] !== purpose) return null;

  if (template === "ACCOUNT_SECURITY_GENERIC") {
    const actionUrl = `${siteUrl}/program?auth=sign-in`;
    return {
      purpose,
      senderCategory: "ACCOUNT",
      subject: "SevenBet account security notice",
      text: `A security action was requested for your SevenBet account. Open SevenBet directly to review account access: ${actionUrl}\n\nSevenBet will never ask for your password by email.`,
      html: `<p>A security action was requested for your SevenBet account.</p><p><a href="${actionUrl}">Review account access on SevenBet</a></p><p>SevenBet will never ask for your password by email.</p>`,
    };
  }

  const actionUrl = `${siteUrl}/program`;
  if (template === "PROGRAMME_USER_REQUESTED_REMINDER") {
    return {
      purpose,
      senderCategory: "PROGRAMME",
      subject: "Your requested SevenBet Programme reminder",
      text: `You asked SevenBet to remind you to return to your private Programme. Continue when it suits you: ${actionUrl}\n\nThis message contains no private Programme narrative.`,
      html: `<p>You asked SevenBet to remind you to return to your private Programme.</p><p><a href="${actionUrl}">Continue when it suits you</a></p><p>This message contains no private Programme narrative.</p>`,
    };
  }

  return {
    purpose,
    senderCategory: "PROGRAMME",
    subject: "A quiet reminder from your SevenBet Programme",
    text: `You opted in to occasional Programme reminders. Your private Programme is available when you choose to return: ${actionUrl}\n\nReply with “stop” to stop Programme engagement messages.`,
    html: `<p>You opted in to occasional Programme reminders.</p><p><a href="${actionUrl}">Return to your private Programme</a></p><p>Reply with “stop” to stop Programme engagement messages.</p>`,
  };
}
