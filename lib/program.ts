export type ProgramStep = {
  day: number;
  title: string;
  focus: string;
  tasks: string[];
};

export const programSteps: ProgramStep[] = [
  {
    day: 1,
    title: "Honest starting point",
    focus: "Review real deposits, time spent playing and current urge to gamble.",
    tasks: ["Write down bankroll", "Check deposit history", "Rate urge 1-10"],
  },
  {
    day: 2,
    title: "Limit before entry",
    focus: "Set money, time and stop-loss before opening a casino.",
    tasks: ["Deposit limit", "Loss limit", "Session timer"],
  },
  {
    day: 3,
    title: "Pause before betting",
    focus: "Break the automatic impulse to deposit loop.",
    tasks: ["10-minute pause", "Write down the reason", "Check mood"],
  },
  {
    day: 4,
    title: "One-session rule",
    focus: "Keep play from spreading across the whole day.",
    tasks: ["One time window", "One site", "Post-session summary"],
  },
  {
    day: 5,
    title: "Anti-chasing",
    focus: "Stop risk escalation after losses.",
    tasks: ["Stop phrase", "End-of-day amount", "Break after losses"],
  },
  {
    day: 6,
    title: "Bonus without the trap",
    focus: "Claim a bonus only if it does not change your limit.",
    tasks: ["Wagering", "Max bet", "Expiry window"],
  },
  {
    day: 7,
    title: "No-deposit day",
    focus: "Check whether you can leave the impulse without acting on it.",
    tasks: ["No deposit", "Alternative activity", "Evening urge rating"],
  },
  {
    day: 8,
    title: "Safer shortlist",
    focus: "Keep only casinos with license, limits and understandable terms.",
    tasks: ["License", "Self-exclusion tools", "Favorites"],
  },
  {
    day: 9,
    title: "External control",
    focus: "Make budget and payments visible rather than hidden.",
    tasks: ["Notifications", "Trusted person", "Help contact"],
  },
  {
    day: 10,
    title: "Personal play code",
    focus: "Define when play remains entertainment and when it must stop.",
    tasks: ["Monthly limit", "Stop signals", "No-play days"],
  },
];
