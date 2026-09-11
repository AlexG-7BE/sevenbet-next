import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Email preferences | B4GAMBLE", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; status?: string; test?: string }> }) {
  const { token = "", status, test } = await searchParams;
  const validShape = /^[A-Za-z0-9_-]{43}$/.test(token);
  return (
    <main className="unsubscribePage">
      <section>
        <p className="eyebrow">Email preferences</p>
        <h1>{status === "confirmed" ? "You are unsubscribed." : status === "invalid" ? "We could not verify this link." : "Stop marketing email"}</h1>
        {status === "confirmed" ? <p>Your choice is saved. B4GAMBLE will block future marketing and Programme reminder emails. Necessary account-security messages remain separate.</p>
          : status === "invalid" ? <p>This unsubscribe link is invalid or could not be processed. No account preference was changed.</p>
            : test ? <p>This is a test-send preview. It cannot change customer preferences.</p>
              : validShape ? <><p>Confirm below to stop B4GAMBLE marketing and Programme reminder email. You do not need to sign in.</p><form action="/api/email/unsubscribe" method="post"><input name="token" type="hidden" value={token} /><button className="button gold" type="submit">Confirm unsubscribe</button></form></>
                : <p>This unsubscribe link is not valid. No account preference was changed.</p>}
        <Link href="/">Return to B4GAMBLE</Link>
      </section>
    </main>
  );
}
