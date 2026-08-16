import { permanentRedirect } from "next/navigation";

export default function SelfCheckRedirect() {
  permanentRedirect("/responsible-gambling");
}
