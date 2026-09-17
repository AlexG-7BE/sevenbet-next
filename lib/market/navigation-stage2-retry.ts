export function createCommercialNavigationRetryRegistry() {
  const activePaths = new Set<string>();

  return {
    claim(pathname: string) {
      if (activePaths.has(pathname)) return false;
      activePaths.add(pathname);
      return true;
    },
    clear(pathname: string) {
      activePaths.delete(pathname);
    },
  };
}
