import type { GovernedCommercialAction } from "../lib/commercial/governed-commercial-action";
import type {
  PublicCommercialActionAuthority,
  PublicCommercialActionSubject,
  ResolvePublicCommercialActionsInput,
} from "../lib/commercial/public-commercial-action-resolver";

type ActionFixtureResolver = (
  subject: PublicCommercialActionSubject,
  input: ResolvePublicCommercialActionsInput,
) => GovernedCommercialAction | null;

export function commercialActionAuthority(
  resolve: ActionFixtureResolver,
): PublicCommercialActionAuthority {
  return {
    async resolveMany(input) {
      return new Map(input.subjects.map((subject) => {
        const action = resolve(subject, input);
        return [subject.casinoId, {
          action,
          reasonCode: action ? "AVAILABLE" as const : "NO_GOVERNED_ROUTE" as const,
        }];
      }));
    },
  };
}

export function commercialActionsByCasino(
  actions: Readonly<Record<string, `/r/${string}` | null>>,
) {
  return commercialActionAuthority((subject) => {
    const href = actions[subject.casinoId];
    return href ? { href } : null;
  });
}

export const noCommercialActions = commercialActionAuthority(() => null);
