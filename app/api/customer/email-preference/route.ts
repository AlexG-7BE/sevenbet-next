import { NextResponse } from "next/server";

import { AuthenticationRequiredError, requireCurrentUser } from "@/lib/auth/session";
import {
  readCustomerEmailPreference,
  updateCustomerEmailPreference,
} from "@/lib/customers/email-preference.server";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import { isSameOriginMutation } from "@/lib/http/mutation-request";
import { readBoundedRequestText } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  const result = NextResponse.json(body, { status });
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("Vary", "Cookie");
  return result;
}

function unavailableResponse() {
  const result = response({ code: "SERVICE_UNAVAILABLE" }, 503);
  result.headers.set("Retry-After", "3");
  return result;
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const preference = await readCustomerEmailPreference(user.id);
    return response({
      marketingAllowed: preference?.marketingAllowed ?? false,
      unsubscribed: Boolean(preference?.unsubscribedAt),
      suppressed: preference?.suppressionScope !== undefined && preference.suppressionScope !== "NONE",
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return response({ code: "AUTHENTICATION_REQUIRED" }, 401);
    }
    if (isTransientDatabaseAvailabilityError(error)) return unavailableResponse();
    return response({ code: "EMAIL_PREFERENCE_UNAVAILABLE" }, 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return response({ code: "CROSS_ORIGIN_DENIED" }, 403);
  try {
    const user = await requireCurrentUser(request.headers);
    const text = await readBoundedRequestText(request, 2048);
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    const body = value as Record<string, unknown>;
    if (Object.keys(body).some((key) => !["marketingAllowed", "locale"].includes(key))
      || typeof body.marketingAllowed !== "boolean") {
      throw new Error("invalid");
    }
    const locale = typeof body.locale === "string" && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(body.locale)
      ? body.locale : null;
    const preference = await updateCustomerEmailPreference(user.id, {
      marketingAllowed: body.marketingAllowed,
      source: "PROGRAMME_SIGNUP",
      policyVersion: "email-marketing-v1",
      locale,
    });
    return response(preference);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return response({ code: "AUTHENTICATION_REQUIRED" }, 401);
    }
    if (isTransientDatabaseAvailabilityError(error)) return unavailableResponse();
    return response({ code: "INVALID_EMAIL_PREFERENCE" }, 400);
  }
}
