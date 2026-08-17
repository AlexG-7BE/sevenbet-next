import Link from "next/link";

export default function ProgrammeNotFound() {
  return (
      <main>
        <section className="pageShell">
          <div className="container">
            <div className="card discoveryEmpty">
              <p className="eyebrow">Programme page not found</p>
              <h1>This Programme page is unavailable.</h1>
              <p>The link may be outdated. Your Programme data and progress have not been changed.</p>
              <div className="heroActions">
                <Link className="button gold" href="/program">Return to My Programme</Link>
                <Link className="button ghost" href="/help">Open Help</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
