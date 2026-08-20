import Link from "next/link";

export function CommercialNav() {
  return <nav className="commercialSubnav" aria-label="Commercial operations"><Link href="/admin/commercial">Pipeline</Link><Link href="/admin/commercial/partners">Partners</Link><Link href="/admin/commercial/analytics">Analytics</Link></nav>;
}
