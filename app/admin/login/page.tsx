import type { Metadata } from "next";
import { Badge, Button, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "CMS Login | SevenBet",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="warning">Restricted preview</Badge>
          <h1>SevenBet CMS Login</h1>
          <p className="lead">
            Phase 1 uses a temporary preview token while the production auth provider is connected.
            Visit the admin URL with the configured token to set a secure preview cookie.
          </p>
          <div className="adminCode">/admin?token=YOUR_PREVIEW_TOKEN</div>
          <p className="muted">
            Set <strong>SEVENBET_ADMIN_PREVIEW_TOKEN</strong> in the deployment environment before exposing this admin area.
          </p>
          <Button href="/" variant="ghost">
            Return to site
          </Button>
        </Card>
      </Container>
    </div>
  );
}
