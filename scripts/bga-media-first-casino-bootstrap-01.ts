import { EditorialStatus, Prisma } from "@prisma/client";

import { deterministicCasinoIngestionId } from "../lib/casino-ingestion/importer";
import prisma from "../lib/db/prisma";
import { casinoRepository } from "../lib/repositories/casino.repository";

const RELEASE = "BGA-MEDIA-FIRST-CASINO-BOOTSTRAP-01";
const ACTOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

const INKABET_OPPORTUNITY_ID = "f915fdee-3426-449f-98ef-9309d20c1262";
const BETSAFE_OPPORTUNITY_ID = "079c2e65-c94f-428d-a27d-8c9c0e808bfd";

const definitions = [
  {
    slug: "inkabet",
    title: "Inkabet",
    domain: "inkabet.pe",
    websiteUrl: "https://www.inkabet.pe/",
    summary: "Inkabet casino profile. Detailed licensing, payments and market information are being verified and will be added separately.",
    description: "B4GAMBLE has created this provisional Inkabet profile from current partner-supplied casino media and routing evidence. Detailed licensing, payment methods, game catalogue facts and editorial scoring are intentionally left unpopulated until separately verified.",
    opportunityId: INKABET_OPPORTUNITY_ID,
    countries: [
      { code: "PE", localDomain: "inkabet.pe", localWebsiteUrl: "https://www.inkabet.pe/" },
    ],
    canonicalTrackingUrl: "https://record.inkabet.pe/_p1EHTRI5UEM4wXYzsHHtsGNd7ZgqdRLk/1/",
    routeSlug: "inkabet-casino",
    offerLabel: "Inkabet Casino",
    hosted: {
      card: ["66a38fe590bf7ecba8e6ec20"],
      mobile: ["66a38fe590bf7ecba8e6ec21"],
      desktop: ["66a38fe590bf7ecba8e6ec24"],
    },
  },
  {
    slug: "betsafe",
    title: "Betsafe",
    domain: "betsafe.com",
    websiteUrl: "https://www.betsafe.com/",
    summary: "Betsafe casino profile. Detailed licensing, payments and market information are being verified and will be added separately.",
    description: "B4GAMBLE has created this provisional Betsafe profile from current partner-supplied Baltics casino media and routing evidence. Detailed licensing, payment methods, game catalogue facts and editorial scoring are intentionally left unpopulated until separately verified.",
    opportunityId: BETSAFE_OPPORTUNITY_ID,
    countries: [
      { code: "EE", localDomain: "betsafe.ee", localWebsiteUrl: "https://www.betsafe.ee/en/casino" },
      { code: "LV", localDomain: "betsafe.lv", localWebsiteUrl: "https://www.betsafe.lv/en/casino" },
    ],
    canonicalTrackingUrl: "https://record.betssongroupaffiliates.com/_p1EHTRI5UENm9wicw_ZaAGNd7ZgqdRLk/1/",
    routeSlug: "betsafe-casino",
    offerLabel: "Betsafe Casino",
    hosted: {
      card: ["6a1017fee7be921323b816c8", "666bf999137dd6c92914a2eb"],
      mobile: ["6a1017fee7be921323b816ca", "666bf999137dd6c92914a2ee"],
      desktop: ["6a1017fee7be921323b816cc", "666bf999137dd6c92914a2f3"],
    },
  },
] as const;

function id(...parts: string[]) {
  return deterministicCasinoIngestionId([RELEASE, ...parts].join(":"));
}

function json(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  return value;
}

async function actorId() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: [...ACTOR_ROLES] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error(`${RELEASE}: no governed CMS actor is available`);
  return actor.id;
}

async function ensureBaseRows(actor: string) {
  const networkId = id("network", "betsson-group-affiliates");
  await prisma.affiliateNetwork.upsert({
    where: { id: networkId },
    create: {
      id: networkId,
      name: "Betsson Group Affiliates",
      slug: "betsson-group-affiliates",
      type: "NETWORK",
      active: true,
      notes: `${RELEASE}: media-first hosted-creative authority substrate; not an activation claim.`,
      createdBy: actor,
      updatedBy: actor,
    },
    update: { active: true, updatedBy: actor },
  });

  for (const definition of definitions) {
    const casinoId = id("casino", definition.slug);
    const existingBySlug = await prisma.casino.findUnique({ where: { slug: definition.slug }, select: { id: true, domain: true } });
    if (existingBySlug && existingBySlug.id !== casinoId) throw new Error(`${RELEASE}: ${definition.slug} already exists with an unexpected identity`);
    const existingByDomain = await prisma.casino.findUnique({ where: { domain: definition.domain }, select: { id: true, slug: true } });
    if (existingByDomain && existingByDomain.id !== casinoId) throw new Error(`${RELEASE}: ${definition.domain} belongs to ${existingByDomain.slug}`);

    await prisma.casino.upsert({
      where: { id: casinoId },
      create: {
        id: casinoId,
        slug: definition.slug,
        internalName: definition.title,
        title: definition.title,
        domain: definition.domain,
        websiteUrl: definition.websiteUrl,
        operator: "Betsson Group Affiliates",
        summary: definition.summary,
        description: definition.description,
        language: "en",
        languages: [],
        currencies: [],
        editorScore: null,
        domainLifecycleStatus: "UNKNOWN",
        domainPublicationStatus: "DRAFT",
        trackingMetadata: json({
          release: RELEASE,
          profilePublicationMode: "MEDIA_FIRST_PROVISIONAL",
          factualEnrichmentPending: true,
          commercialReferralAuthority: false,
        }),
        status: EditorialStatus.DRAFT,
        createdBy: actor,
        updatedBy: actor,
      },
      update: {
        summary: definition.summary,
        description: definition.description,
        trackingMetadata: json({
          release: RELEASE,
          profilePublicationMode: "MEDIA_FIRST_PROVISIONAL",
          factualEnrichmentPending: true,
          commercialReferralAuthority: false,
        }),
        updatedBy: actor,
      },
    });

    await prisma.casinoSeo.upsert({
      where: { casinoId },
      create: {
        casinoId,
        title: `${definition.title} Casino | B4GAMBLE`,
        description: `${definition.title} casino profile on B4GAMBLE. Detailed factual review is being completed.`,
        canonicalUrl: `https://b4gamble.com/casino/${definition.slug}`,
        robots: "noindex,follow",
      },
      update: {
        title: `${definition.title} Casino | B4GAMBLE`,
        description: `${definition.title} casino profile on B4GAMBLE. Detailed factual review is being completed.`,
        canonicalUrl: `https://b4gamble.com/casino/${definition.slug}`,
        robots: "noindex,follow",
      },
    });

    for (const country of definition.countries) {
      await prisma.casinoCountry.upsert({
        where: { casinoId_countryCode: { casinoId, countryCode: country.code } },
        create: {
          id: id("casino-country", definition.slug, country.code),
          casinoId,
          countryCode: country.code,
          availability: "UNKNOWN",
          localDomain: country.localDomain,
          localWebsiteUrl: country.localWebsiteUrl,
          notes: `${RELEASE}: market identity is supported by current partner media/routing evidence; availability facts are intentionally pending.`,
        },
        update: {
          availability: "UNKNOWN",
          localDomain: country.localDomain,
          localWebsiteUrl: country.localWebsiteUrl,
          notes: `${RELEASE}: market identity is supported by current partner media/routing evidence; availability facts are intentionally pending.`,
        },
      });
    }

    const programId = id("program", definition.slug);
    const offerId = id("offer", definition.slug);
    const trackingLinkId = id("tracking", definition.slug);
    const redirectId = id("redirect", definition.slug);

    await prisma.affiliateProgram.upsert({
      where: { id: programId },
      create: {
        id: programId,
        networkId,
        casinoId,
        externalProgramId: `${RELEASE}:${definition.slug}`,
        name: `${definition.title} / Betsson Group Affiliates`,
        operator: "Betsson Group Affiliates",
        status: "DRAFT",
        workflowStatus: EditorialStatus.DRAFT,
        providerType: "BANNERFLOW",
        connectionStatus: "DISCONNECTED",
        integrationMode: "MANUAL",
        supportedCountries: definition.countries.map((country) => country.code),
        metadata: json({ release: RELEASE, purpose: "HOSTED_CREATIVE_BINDING_ONLY" }),
        sourceOfTruth: json({ source: "FOUNDER_SUPPLIED_BGA_MEDIA_STORE_EXPORT", observedAt: "2026-09-06" }),
        notes: `${RELEASE}: canonical binding substrate only. Program remains DRAFT and grants no Production referral authority.`,
        createdBy: actor,
        updatedBy: actor,
      },
      update: { casinoId, updatedBy: actor },
    });

    await prisma.affiliateOffer.upsert({
      where: { id: offerId },
      create: {
        id: offerId,
        programId,
        casinoId,
        externalOfferId: `${RELEASE}:${definition.slug}:casino`,
        externalName: `${definition.title} Casino`,
        internalName: `${definition.title} hosted creative binding`,
        publicLabel: definition.offerLabel,
        offerType: "CASINO",
        status: "DRAFT",
        payoutModel: "UNKNOWN",
        geoMode: "ALLOW",
        languages: [],
        devices: [],
        evergreen: true,
        featured: false,
        priority: 0,
        notes: `${RELEASE}: media binding record; no bonus terms or Production commercial eligibility asserted.`,
        metadata: json({ release: RELEASE, publicationPurpose: "PARTNER_HOSTED_CREATIVE_BINDING" }),
        createdBy: actor,
        updatedBy: actor,
      },
      update: { status: "DRAFT", updatedBy: actor },
    });

    for (const country of definition.countries) {
      await prisma.affiliateOfferCountry.upsert({
        where: { offerId_countryCode: { offerId, countryCode: country.code } },
        create: { offerId, countryCode: country.code, mode: "ALLOW" },
        update: { mode: "ALLOW" },
      });
    }

    await prisma.affiliateTrackingLink.upsert({
      where: { id: trackingLinkId },
      create: {
        id: trackingLinkId,
        offerId,
        externalLinkId: `${RELEASE}:${definition.slug}:canonical`,
        label: `${definition.title} canonical casino relationship`,
        destinationUrl: definition.canonicalTrackingUrl,
        trackingUrl: definition.canonicalTrackingUrl,
        geoMode: "ALLOW",
        deviceTarget: "ALL",
        active: true,
        priority: 0,
        source: "FOUNDER_BGA_DIRECT_LINK_EXPORT",
        metadata: json({
          release: RELEASE,
          bindingOnly: true,
          productionEligibleByDefault: false,
          exactSource: "betsson_media_store_direct_links_product_casino.csv",
        }),
        createdBy: actor,
        updatedBy: actor,
      },
      update: {
        destinationUrl: definition.canonicalTrackingUrl,
        trackingUrl: definition.canonicalTrackingUrl,
        active: true,
        updatedBy: actor,
      },
    });

    for (const country of definition.countries) {
      await prisma.affiliateTrackingLinkCountry.upsert({
        where: { trackingLinkId_countryCode: { trackingLinkId, countryCode: country.code } },
        create: {
          trackingLinkId,
          countryCode: country.code,
          mode: "ALLOW",
          productionEligible: false,
          productionEligibilityEvidence: RELEASE,
          productionEligibilityNotes: "Media-first bootstrap only; Founder has not activated referral authority in this record.",
        },
        update: {
          mode: "ALLOW",
          productionEligible: false,
          productionEligibilityEvidence: RELEASE,
          productionEligibilityNotes: "Media-first bootstrap only; Founder has not activated referral authority in this record.",
        },
      });
    }

    await prisma.affiliateRedirectSlug.upsert({
      where: { id: redirectId },
      create: {
        id: redirectId,
        slug: definition.routeSlug,
        casinoId,
        affiliateOfferId: offerId,
        active: true,
        createdBy: actor,
        updatedBy: actor,
      },
      update: { casinoId, affiliateOfferId: offerId, active: true, archivedAt: null, updatedBy: actor },
    });

    await prisma.commercialOpportunity.updateMany({
      where: { id: definition.opportunityId, casinoId: null },
      data: { casinoId, updatedBy: actor },
    });
  }
}

async function ensureHostedAssignments(actor: string) {
  for (const definition of definitions) {
    const casinoId = id("casino", definition.slug);
    const offerId = id("offer", definition.slug);
    const wanted = [...definition.hosted.card, ...definition.hosted.mobile, ...definition.hosted.desktop];
    const creatives = await prisma.partnerHostedCreative.findMany({
      where: {
        casinoId,
        externalCreativeId: { in: wanted },
        active: true,
        archivedAt: null,
        validationState: "VALIDATED",
        destinationVerificationState: "VERIFIED",
        affiliateOfferId: offerId,
      },
      select: { id: true, externalCreativeId: true, countryCode: true, languageCode: true, languageState: true },
    });
    const byExternal = new Map(creatives.map((creative) => [creative.externalCreativeId, creative]));
    if (wanted.some((externalId) => !byExternal.has(externalId))) continue;

    for (const externalId of definition.hosted.card) {
      const creative = byExternal.get(externalId)!;
      const reference = `${RELEASE}:${definition.slug}:card:${externalId}`;
      const existing = await prisma.casinoPartnerHostedCreativeAssignment.findFirst({ where: { casinoId, reference } });
      const data = {
        casinoId,
        creativeId: creative.id,
        placement: "CASINO_DIRECTORY_CARD" as const,
        variant: "DEFAULT" as const,
        countryCode: creative.countryCode,
        languageCode: creative.languageCode,
        languageState: creative.languageState,
        renderingMode: "CONTAIN" as const,
        sortOrder: 0,
        active: true,
        reference,
      };
      if (existing) await prisma.casinoPartnerHostedCreativeAssignment.update({ where: { id: existing.id }, data });
      else await prisma.casinoPartnerHostedCreativeAssignment.create({ data });
    }

    for (const [variant, ids] of [["MOBILE", definition.hosted.mobile], ["DESKTOP", definition.hosted.desktop]] as const) {
      for (const externalId of ids) {
        const creative = byExternal.get(externalId)!;
        const reference = `${RELEASE}:${definition.slug}:offer:${variant.toLowerCase()}:${externalId}`;
        const existing = await prisma.affiliateOfferPartnerHostedCreativeAssignment.findFirst({ where: { affiliateOfferId: offerId, reference } });
        const data = {
          affiliateOfferId: offerId,
          creativeId: creative.id,
          placement: "CASINO_OFFER_BLOCK" as const,
          variant,
          countryCode: creative.countryCode,
          languageCode: creative.languageCode,
          languageState: creative.languageState,
          renderingMode: "CONTAIN" as const,
          sortOrder: 0,
          active: true,
          reference,
        };
        if (existing) await prisma.affiliateOfferPartnerHostedCreativeAssignment.update({ where: { id: existing.id }, data });
        else await prisma.affiliateOfferPartnerHostedCreativeAssignment.create({ data });
      }
    }

    const casino = await prisma.casino.findUnique({ where: { id: casinoId }, select: { status: true, updatedAt: true } });
    if (!casino || casino.status === EditorialStatus.PUBLISHED) continue;
    if (casino.status !== EditorialStatus.DRAFT) throw new Error(`${RELEASE}: ${definition.slug} is in unexpected workflow state ${casino.status}`);

    const approved = await prisma.casino.update({
      where: { id: casinoId },
      data: {
        status: EditorialStatus.APPROVED,
        domainPublicationStatus: "APPROVED",
        updatedBy: actor,
      },
      select: { updatedAt: true },
    });
    await casinoRepository.publishWithVersion(casinoId, actor, approved.updatedAt);
    await prisma.casino.update({
      where: { id: casinoId },
      data: { domainPublicationStatus: "PUBLISHED", updatedBy: actor },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor,
        action: "media-first-provisional-publish",
        entityType: "casino",
        entityId: casinoId,
        summary: `${RELEASE}: published provisional ${definition.title} profile after hosted creative verification`,
        metadata: json({ release: RELEASE, factualEnrichmentPending: true, referralAuthorityGranted: false }),
      },
    });
  }
}

async function verifyState() {
  const state = [];
  for (const definition of definitions) {
    const casinoId = id("casino", definition.slug);
    const casino = await prisma.casino.findUnique({
      where: { id: casinoId },
      select: {
        slug: true,
        status: true,
        editorScore: true,
        domainPublicationStatus: true,
        licenses: { select: { id: true } },
        paymentMethods: { select: { id: true } },
        versions: { where: { status: EditorialStatus.PUBLISHED }, select: { id: true } },
        partnerHostedCreatives: {
          where: { active: true, archivedAt: null },
          select: { externalCreativeId: true, validationState: true, destinationVerificationState: true },
        },
        partnerHostedAssignments: { where: { active: true }, select: { placement: true, variant: true, countryCode: true } },
      },
    });
    state.push({
      slug: definition.slug,
      status: casino?.status ?? "ABSENT",
      domainPublicationStatus: casino?.domainPublicationStatus ?? null,
      editorScore: casino?.editorScore ?? null,
      licences: casino?.licenses.length ?? 0,
      payments: casino?.paymentMethods.length ?? 0,
      publishedVersions: casino?.versions.length ?? 0,
      hostedCreatives: casino?.partnerHostedCreatives.length ?? 0,
      casinoHostedAssignments: casino?.partnerHostedAssignments.length ?? 0,
    });
  }
  console.info(JSON.stringify({ release: RELEASE, state }, null, 2));
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "build-preflight" && mode !== "verify") throw new Error(`${RELEASE}: use build-preflight or verify`);
  if (mode === "build-preflight" && process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }
  const actor = await actorId();
  if (mode === "build-preflight") {
    await ensureBaseRows(actor);
    await ensureHostedAssignments(actor);
  }
  await verifyState();
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
