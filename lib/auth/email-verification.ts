import type { BetterAuthOptions } from "better-auth";

/**
 * Founder decision, 27 Sep 2026: every email sign-up is sent the confirmation
 * link straight away, so customers become reachable for reminders and
 * campaigns (marketing eligibility requires a verified address).
 *
 * The link stays valid for 24 hours because people often open the email
 * later; Better Auth's default is 1 hour. Opening it confirms the address,
 * signs the customer in on that device and lands them on the callback URL
 * (their Programme). Staff accounts cannot be signed in this way: the admin
 * MFA session hook refuses session creation outside the MFA paths.
 */
export const EMAIL_VERIFICATION_LINK_SECONDS = 24 * 60 * 60;

export type VerificationEmailDelivery = (input: {
  user: { id: string; name: string; email: string };
  url: string;
}) => void;

export function customerEmailVerificationOptions(deliver: VerificationEmailDelivery) {
  return {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: EMAIL_VERIFICATION_LINK_SECONDS,
    // Better Auth 1.7.1 awaits this callback inside the sign-up request (no
    // `advanced.backgroundTasks` handler is configured). It only schedules the
    // delivery, so sign-up never waits on, or fails because of, email.
    sendVerificationEmail: async ({ user, url }) => {
      try {
        deliver({ user: { id: user.id, name: user.name, email: user.email }, url });
      } catch {
        console.warn("[email] verification delivery could not be scheduled", {
          email_failure_category: "schedule",
          email_purpose: "EMAIL_VERIFICATION",
        });
      }
    },
  } satisfies NonNullable<BetterAuthOptions["emailVerification"]>;
}
