/**
 * The account this page has shown signed in since it loaded.
 *
 * The site header reads the session cookie once, when the document is rendered. The Programme can
 * sign a person in without loading a new document (email sign-up), so its signed-in screens say
 * so here and the menu's Log out line follows. Nothing is stored and nothing is fetched.
 */
let signedInUserId: string | null = null;
const listeners = new Set<() => void>();

export function noteSignedInUser(userId: string) {
  if (signedInUserId === userId) return;
  signedInUserId = userId;
  for (const listener of listeners) listener();
}

export function subscribeSignedInUser(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function signedInUser() {
  return signedInUserId;
}
