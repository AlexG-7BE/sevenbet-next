import { Card } from "@/components/ui";
import type { MediaAssignmentSubjectType } from "@/lib/media/placement-media";

export function PlacementMediaEditor({
  casinoId,
  subjectId,
  subjectType,
}: {
  casinoId: string;
  subjectId: string;
  subjectType: MediaAssignmentSubjectType;
}) {
  void casinoId;
  void subjectId;
  void subjectType;
  return <Card>
    <strong>Promotional placement media retired</strong>
    <p className="muted">Commercial routes are managed through MarketActivation. Canonical operator logos are managed in the Casino editor.</p>
  </Card>;
}
