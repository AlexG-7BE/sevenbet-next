import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import {
  AdminPageShell,
  AdminStatCard,
} from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { ProgramListActions } from "@/components/admin/ProgramBuilder";
import { Badge, Card } from "@/components/ui";
import {
  programBuilderService,
  programService,
} from "@/lib/services";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canAccessAdminArea } from "@/lib/auth/admin-page-policy";
import { canPerformAction } from "@/lib/cms/permissions";

export const metadata: Metadata = {
  title: "Programs | B4GAMBLE CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    language?: string;
  }>;
}) {
  const staff = await getAdminPageAccess(await headers(), "programs");
  if (!staff) return <AdminPermissionDenied />;
  const {
    q = "",
    status = "",
    language = "",
  } = await searchParams;

  const allPrograms =
    await programService.listPrograms();

  const languages = Array.from(
    new Set(
      allPrograms.map(
        (program) => program.language,
      ),
    ),
  ).sort();

  const programs = allPrograms
    .filter(
      (program) =>
        !q ||
        `${program.title} ${program.internalName}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .filter(
      (program) =>
        !status || program.status === status,
    )
    .filter(
      (program) =>
        !language ||
        program.language === language,
    )
    .sort(
      (a, b) =>
        b.updatedAt.getTime() -
        a.updatedAt.getTime(),
    );

  const snapshots = new Map(
    await Promise.all(
      programs.map(async (program) => {
        const snapshot =
          await programBuilderService.findSnapshot(
            program.id,
          );

        return [program.id, snapshot] as const;
      }),
    ),
  );

  return (
    <AdminPageShell
      title="Programs"
      intro="Create, organize, review, version and publish structured educational programs."
      actions={
        canAccessAdminArea(staff, "program-create") ? <Link
          className="button gold"
          href="/admin/programs/new"
        >
          Create program
        </Link> : undefined
      }
    >
      <div className="adminStatsGrid">
        <AdminStatCard
          label="Programs"
          value={programs.length}
          note="Active and archived records"
        />

        <AdminStatCard
          label="Published"
          value={
            programs.filter(
              (item) =>
                item.status === "PUBLISHED",
            ).length
          }
          note="Stable public snapshots"
        />

        <AdminStatCard
          label="In review"
          value={
            programs.filter(
              (item) =>
                item.status === "IN_REVIEW",
            ).length
          }
          note="Waiting for editorial review"
        />

        <AdminStatCard
          label="Drafts"
          value={
            programs.filter(
              (item) => item.status === "DRAFT",
            ).length
          }
          note="Not visible publicly"
        />
      </div>

      <Card className="adminPanel">
        <form className="programFilters">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search programs..."
            aria-label="Search programs"
          />

          <select
            name="status"
            defaultValue={status}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option>DRAFT</option>
            <option>IN_REVIEW</option>
            <option>APPROVED</option>
            <option>SCHEDULED</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </select>

          <select
            name="language"
            defaultValue={language}
            aria-label="Filter by language"
          >
            <option value="">
              All languages
            </option>

            {languages.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            className="button ghost"
            type="submit"
          >
            Apply filters
          </button>
        </form>

        <div className="programList">
          {programs.map((program) => {
            const snapshot =
              snapshots.get(program.id);

            const stepCount =
              snapshot?.steps.length ?? 0;

            const lessonCount =
              snapshot?.steps.reduce(
                (total, step) =>
                  total +
                  step.lessons.length,
                0,
              ) ?? 0;

            return (
              <article key={program.id}>
                <div>
                  <div className="badgeCluster">
                    <Badge
                      tone={
                        program.status ===
                        "PUBLISHED"
                          ? "green"
                          : "warning"
                      }
                    >
                      {program.status}
                    </Badge>

                    <Badge>
                      v{program.publishedVersion}
                    </Badge>

                    <Badge>
                      {program.language}
                    </Badge>
                  </div>

                  <h2>{program.title}</h2>

                  <p className="muted">
                    {stepCount} steps ·{" "}
                    {lessonCount} lessons
                  </p>

                  <p className="muted">
                    Updated{" "}
                    {program.updatedAt.toLocaleDateString(
                      "en-US",
                    )}
                  </p>
                </div>

                <div>
                  <Link
                    className="button ghost"
                    href={`/admin/programs/${program.id}`}
                  >
                    Dashboard
                  </Link>

                  <ProgramListActions
                    programId={program.id}
                    canDuplicate={canAccessAdminArea(staff, "program-create")}
                    canArchive={canPerformAction(staff, "program.archive")}
                  />

                  {canAccessAdminArea(staff, "program-edit") ? <Link
                    className="button gold"
                    href={`/admin/programs/${program.id}/builder`}
                  >
                    Open builder
                  </Link> : null}
                </div>
              </article>
            );
          })}

          {!programs.length && (
            <p className="muted">
              No programs match these filters.
            </p>
          )}
        </div>
      </Card>
    </AdminPageShell>
  );
}
