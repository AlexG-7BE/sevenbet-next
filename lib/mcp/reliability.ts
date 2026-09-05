import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";

export function mcpMethodNotAllowedResponse() {
  return Response.json(
    { error: "method_not_allowed" },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    },
  );
}

export function mcpDatabaseUnavailableResponse() {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32003,
        message: "Operational data is temporarily unavailable",
      },
      id: null,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "3",
      },
    },
  );
}

export async function runMcpPostBoundary(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    if (isTransientDatabaseAvailabilityError(error)) {
      return mcpDatabaseUnavailableResponse();
    }
    throw error;
  }
}
