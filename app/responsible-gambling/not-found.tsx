import Link from "next/link";

export default function ProtectedHelpNotFound() {
  return (
    <section className="pageShell">
      <div className="container">
        <div className="card discoveryEmpty">
          <p className="eyebrow">Help page not found</p>
          <h1>This support page is unavailable.</h1>
          <p>The link may be outdated. You can return to the Help centre or leave this section.</p>
          <div className="heroActions">
            <Link className="button gold" href="/responsible-gambling">Return to Help</Link>
            <Link className="button ghost" href="/">Go home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
