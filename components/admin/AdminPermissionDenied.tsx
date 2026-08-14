import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { Badge, Card, Container } from "@/components/ui";

export function AdminPermissionDenied() {
  return (
    <main className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="warning">Permission required</Badge>
          <h1>This admin area is not available</h1>
          <p className="lead">
            Your staff account is signed in, but its role does not include this
            area. Choose an available workspace or ask a super administrator to
            review the role.
          </p>
          <Link className="button ghost" href="/admin">Return to dashboard</Link>
          <AdminLogoutButton />
        </Card>
      </Container>
    </main>
  );
}
