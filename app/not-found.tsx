import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformNotFoundHandoff } from "@/lib/final-handoff/transforms";

export default function NotFound() { return <HandoffPage name="notFound" transform={transformNotFoundHandoff} />; }
