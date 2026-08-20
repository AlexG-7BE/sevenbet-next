import type { ReactNode } from "react";

import { MobileDirectoryFilters } from "@/components/directory-filters/MobileDirectoryFilters";

export function MobileBonusFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  return (
    <MobileDirectoryFilters activeCount={activeCount} dialogId="bonus-filter-dialog" title="Filter bonuses">
      {children}
    </MobileDirectoryFilters>
  );
}
