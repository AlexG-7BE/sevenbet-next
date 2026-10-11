/**
 * Founder decision, 11 Oct 2026: one email-and-password step serves new and
 * returning people. There is no separate "sign up" and "log in": the same
 * button creates the account or signs in to the one that already owns the
 * email. An account works at once; the confirmation link goes out in the
 * background (Founder decision, 27 Sep 2026).
 */

type EmailEntryResponse = {
  data?: { user?: { id?: string } | null } | null;
  error?: { code?: string } | null;
};

type EmailCredentials = { email: string; password: string };

export type EmailEntryAuth = {
  signUp: (credentials: EmailCredentials) => Promise<EmailEntryResponse>;
  signIn: (credentials: EmailCredentials) => Promise<EmailEntryResponse>;
};

export type EmailEntryInput = EmailCredentials & {
  /**
   * Which request goes first. Most people on the Programme save step are new;
   * most people on Log in return. "existing-only" never creates an account
   * (linking Google to the account that already owns the email).
   */
  expect: "new" | "returning" | "existing-only";
};

export type EmailEntryResult =
  | { kind: "created" | "signed-in"; userId: string }
  /** The email has an account and this is not its password. */
  | { kind: "wrong-password" }
  | { kind: "failed" };

const ACCOUNT_EXISTS_CODES = new Set(["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"]);
const REJECTED_CREDENTIALS_CODE = "INVALID_EMAIL_OR_PASSWORD";

const ATTEMPTS = {
  new: ["signUp", "signIn"],
  returning: ["signIn", "signUp"],
  "existing-only": ["signIn"],
} as const satisfies Record<EmailEntryInput["expect"], readonly (keyof EmailEntryAuth)[]>;

export async function continueWithEmail(input: EmailEntryInput, auth: EmailEntryAuth): Promise<EmailEntryResult> {
  const credentials = { email: input.email.trim().toLowerCase(), password: input.password };
  let rejected = false;
  for (const attempt of ATTEMPTS[input.expect]) {
    const result = await auth[attempt](credentials);
    const userId = result.data?.user?.id;
    if (!result.error && userId) return { kind: attempt === "signUp" ? "created" : "signed-in", userId };
    const code = result.error?.code ?? "";
    if (attempt === "signUp") {
      if (!ACCOUNT_EXISTS_CODES.has(code)) return { kind: "failed" };
      // The email is taken: only its own password opens it.
      rejected = true;
    } else {
      // Sign-in answers an unknown email and a wrong password alike.
      if (code !== REJECTED_CREDENTIALS_CODE) return { kind: "failed" };
      if (rejected) return { kind: "wrong-password" };
      rejected = true;
    }
  }
  return rejected ? { kind: "wrong-password" } : { kind: "failed" };
}
