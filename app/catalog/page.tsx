import { CasinoRow } from "@/components/CasinoCards";
import { getCasinos } from "@/lib/data";

export default function CatalogPage() {
  const casinos = getCasinos().slice(0, 80);

  return (
    <section className="pageShell">
      <div className="container">
        <p className="eyebrow">Full catalog</p>
        <h1>Casino catalog for comparison after limits are set.</h1>
        <p className="lead">The first 80 profiles from the database. Next step: connect server filters, search params and SEO pages for countries, payments and providers.</p>
        <div className="catalogList">
          {casinos.map((casino) => (
            <CasinoRow casino={casino} key={casino.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
