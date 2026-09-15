import { NextResponse } from "next/server";

// Retained only as a bounded compatibility tombstone. Better Auth owns sign-out;
// this endpoint cannot authenticate and clears the retired preview cookie.
export async function POST() {
  const response = NextResponse.json(
    { ok: false, code: "LEGACY_ADMIN_LOGOUT_RETIRED" },
    { status: 410 },
  );
  response.cookies.set("sevenbet_admin_preview", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
