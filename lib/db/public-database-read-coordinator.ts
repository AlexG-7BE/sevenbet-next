function usesSingleConnectionPool() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").searchParams.get("connection_limit") === "1";
  } catch {
    return false;
  }
}

class PublicDatabaseReadCoordinator {
  private tail: Promise<void> = Promise.resolve();

  run<T>(operation: () => Promise<T>): Promise<T> {
    if (!usesSingleConnectionPool()) return operation();

    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    return previous.then(operation).finally(release);
  }
}

const publicDatabaseReadCoordinator = new PublicDatabaseReadCoordinator();

/**
 * Prisma queues are normally the concurrency authority. Preview deployments
 * deliberately use a one-connection pool, so public reads share one
 * process-local queue instead of competing until Prisma's pool timeout.
 */
export function runPublicDatabaseRead<T>(operation: () => Promise<T>): Promise<T> {
  return publicDatabaseReadCoordinator.run(operation);
}
