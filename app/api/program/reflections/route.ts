import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/session";
import { ServiceError, ValidationError } from "@/lib/services/service-error";
import { programReflectionService } from "@/lib/services/program-reflection.service";

export const dynamic = "force-dynamic";

function body(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Request body must be a JSON object");
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} is required`);
  return value.trim();
}

function errorResponse(error: unknown) {
  const status = error instanceof ServiceError ? error.statusCode : 400;
  return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to process reflection" }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const programId = requiredString(new URL(request.url).searchParams.get("programId"), "programId");
    const reflections = await programReflectionService.list(user.id, programId);
    return NextResponse.json({ ok: true, reflections: reflections.map(({ id, blockId, content, createdAt, updatedAt }) => ({ id, blockId, content, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() })) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireCurrentUser(request.headers);
    return NextResponse.json({ ok: false, error: "Programme reflections are stored only in this browser session", code: "LOCAL_ONLY_CONTENT" }, { status: 410 });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const value = body(await request.json());
    await programReflectionService.delete(user.id, { programId: requiredString(value.programId, "programId"), blockId: requiredString(value.blockId, "blockId") });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
