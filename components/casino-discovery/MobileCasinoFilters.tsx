import type { ReactNode } from "react";

import { MobileDirectoryFilters } from "@/components/directory-filters/MobileDirectoryFilters";

export function MobileCasinoFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  return (
    <MobileDirectoryFilters activeCount={activeCount} dialogId="casino-filter-dialog" title="Filter casinos">
      {children}
    </MobileDirectoryFilters>
  );
}
