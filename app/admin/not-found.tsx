import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="adminPage">
      <div className="container narrow">
        <section className="adminHeader" aria-labelledby="admin-not-found-title">
          <div>
            <p className="eyebrow">B4GAMBLE CMS · 404</p>
            <h1 id="admin-not-found-title">This admin record is not available.</h1>
            <p className="lead">It may have moved, been removed, or be outside your current workspace.</p>
            <div className="heroActions">
              <Link className="button gold" href="/admin">Admin dashboard</Link>
              <Link className="button ghost" href="/admin/casinos">Casino records</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
