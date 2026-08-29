import type { ReactNode } from "react";

import { MobileDirectoryFilters } from "@/components/directory-filters/MobileDirectoryFilters";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";

export function MobileCasinoFilters({ children, activeCount, messages }: { children: ReactNode; activeCount: number; messages: ProductPageMessages }) {
  return (
    <MobileDirectoryFilters activeCount={activeCount} dialogId="casino-filter-dialog" labels={{ filters: messages.common.filters, refine: messages.common.applyFilters, directoryControls: messages.common.directoryControls, closeFilters: messages.common.closeFilters }} title={messages.casinos.filterTitle}>
      {children}
    </MobileDirectoryFilters>
  );
}
