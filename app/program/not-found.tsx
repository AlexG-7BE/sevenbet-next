import Link from "next/link";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { isProgrammeLocale, programmeHelpPath, programmePath } from "@/lib/programme/presentation";

export default async function ProgrammeNotFound() {
  const presentation = await resolveServerPresentationContext();
  const locale = isProgrammeLocale(presentation.locale) ? presentation.locale : "en-GB";
  const helpHref = programmeHelpPath(locale);
  return (
      <main>
        <section className="pageShell">
          <div className="container">
            <div className="card discoveryEmpty">
              <p className="eyebrow">{programmeText(locale, "Programme page not found")}</p>
              <h1>{programmeText(locale, "This Programme page is unavailable.")}</h1>
              <p>{programmeText(locale, "The link may be outdated. Your Programme data and progress have not been changed.")}</p>
              <div className="heroActions">
                <Link className="button gold" href={programmePath(locale)}>{programmeText(locale, "Return to My Programme")}</Link>
                <Link className="button ghost" href={helpHref}>{programmeText(locale, "Open Help")}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
