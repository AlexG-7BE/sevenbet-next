import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { Badge, Card, Container } from "@/components/ui";

export function AdminAccessDenied() {
  return (
    <div className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="warning">Staff access required</Badge>
          <h1>Admin access is not available</h1>
          <p className="lead">
            This Better Auth account is valid, but it is not linked to a
            SevenBet staff profile. Contact a super administrator if access is
            expected.
          </p>
          <AdminLogoutButton />
        </Card>
      </Container>
    </div>
  );
}
