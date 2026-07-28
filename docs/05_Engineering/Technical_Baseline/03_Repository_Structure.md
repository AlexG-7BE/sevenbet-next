# Repository Structure

## Top-level layout

```text
sevenbet-next/
├── app/              Next.js App Router pages, layouts, route handlers and metadata
├── components/       Public UI, admin builders/editors, shared UI primitives
├── data/             Local JSON data
├── docs/             Product, implementation, and baseline documentation
├── lib/              Auth, CMS, services, repositories, media, affiliate and public-domain logic
├── prisma/           Prisma schema and 10 SQL migrations
├── scripts/          Admin bootstrap, integrity, smoke and visual-QA scripts
├── tests/            Node tests and Playwright browser test
├── .vercel/          Local Vercel-link metadata (not deployment configuration)
├── middleware.ts     Admin-route middleware
├── next.config.mjs   Next configuration
└── package.json      npm manifest and scripts
```

## Routing inventory

| Route category | Detected scope |
| --- | --- |
| Public page routes | 21 non-admin `page.tsx` routes, including dynamic casino, learning and responsible-gambling routes. |
| Admin page routes | 32 `page.tsx` routes under `app/admin/`; 31 are in `(protected)` and `/admin/login` is public. |
| API route handlers | 50 under `app/api/`: auth, administrative CMS/affiliate/media, public resource, and program-progress handlers. |
| Non-API route handlers | `/go/[slug]`, `/r/[slug]`, and `/llms.txt`. |
| Metadata routes | `robots.ts` and `sitemap.ts`. |

Route groups do not affect URLs: `(protected)` is an admin implementation grouping. The generic `/admin/[section]` and generic admin/public API resources are dynamic handlers; they are not evidence that every possible entity/resource is implemented.

## Repository statistics and counting rules

The counts exclude `.git/`, `node_modules/`, `.next/`, `test-results/`, `coverage/`, caches, and `tsconfig.tsbuildinfo`. Source files include `.ts`, `.tsx`, `.mjs`, `.prisma`, and migration `.sql` within application areas.

| Measure | Count / result |
| --- | --- |
| Relevant directories | 176 |
| Relevant files | 351 |
| Source files | 276 |
| Test files | 16 |
| Prisma migrations | 10 |
| Application page routes | 53 |
| Admin page routes | 32 |
| API route handlers | 50 |
| Prisma models | 50 |
| Detected product modules | 9 |
| Languages | TypeScript/TSX, JavaScript (MJS), SQL, Prisma schema language, CSS, JSON, Markdown |
| Frameworks | Next.js App Router, React |

**Detected:** no `public/` directory, GitHub Actions workflow, Tailwind/PostCSS configuration, or separate API/server directory. Git metadata has a configured GitHub `origin`; this confirms source hosting only, not a GitHub service integration in the running application.
