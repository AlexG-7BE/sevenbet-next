import { AffiliateSyncHistoryAdmin } from "@/components/admin/affiliate/AffiliateIntegrationAdmin";

export default async function AffiliateSyncJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  return <AffiliateSyncHistoryAdmin jobId={(await params).jobId} />;
}
