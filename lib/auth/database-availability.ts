import { AsyncLocalStorage } from "node:async_hooks";

import { logger as defaultBetterAuthLogger, type LogLevel } from "@better-auth/core/env";

import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";

type AvailabilityCapture = {
  transientError?: unknown;
};

const availabilityCapture = new AsyncLocalStorage<AvailabilityCapture>();

export const databaseAwareBetterAuthLogger = {
  level: "warn" as const,
  log(level: Exclude<LogLevel, "success">, message: string, ...args: unknown[]) {
    const capture = availabilityCapture.getStore();
    if (capture && !capture.transientError) {
      capture.transientError = [message, ...args].find(isTransientDatabaseAvailabilityError);
    }
    defaultBetterAuthLogger[level](message, ...args);
  },
};

export function withAuthDatabaseAvailabilityCapture<T>(operation: () => Promise<T>) {
  const capture: AvailabilityCapture = {};
  return availabilityCapture.run(capture, async () => {
    try {
      const result = await operation();
      if (capture.transientError && result instanceof Response && result.status >= 500) {
        throw capture.transientError;
      }
      return result;
    } catch (error) {
      if (capture.transientError) throw capture.transientError;
      throw error;
    }
  });
}
