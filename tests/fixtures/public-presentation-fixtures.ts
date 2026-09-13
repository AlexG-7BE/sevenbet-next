import { visualCasinoProfileFixture, withHandoffCasinoProfileData } from "../../lib/final-handoff/visual-data-fixture";
import { publicCasinoToOffers } from "../../lib/public-offer/public-offer.mapper";

export const publicCasinoFixtureIds = Object.freeze(
  Array.from({ length: 25 }, (_, index) => `test-casino-fixture-${String(index + 1).padStart(2, "0")}`),
);

export function publicCasinoProfilesFixture() {
  const profile = visualCasinoProfileFixture("test-casino-profile");
  if (!profile) throw new Error("PUBLIC_PRESENTATION_FIXTURE_UNAVAILABLE");
  return [{ ...withHandoffCasinoProfileData(profile, true), id: publicCasinoFixtureIds[0] }];
}

export function publicOffersFixture() {
  return publicCasinoProfilesFixture().flatMap(publicCasinoToOffers).map((offer) => ({
    ...offer,
    dataClassification: "DEMO_FIXTURE" as const,
    offerPresentation: undefined,
  }));
}
