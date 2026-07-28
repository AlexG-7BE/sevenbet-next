import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pageShell">
      <div className="container">
        <div className="card discoveryEmpty">
          <p className="eyebrow">Page not found</p>
          <h1>This page is unavailable.</h1>
          <p>The link may be outdated, or the content may no longer be published. You can return to educational resources or casino reviews.</p>
          <div className="heroActions">
            <Link className="button gold" href="/">Go home</Link>
            <Link className="button ghost" href="/responsible-gambling">Responsible gambling resources</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
