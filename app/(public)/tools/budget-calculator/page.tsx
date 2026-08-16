import { permanentRedirect } from "next/navigation";

export default function LimitTrackerRedirect() {
  permanentRedirect("/responsible-gambling");
}
