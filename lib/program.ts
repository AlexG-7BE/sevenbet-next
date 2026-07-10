export type ProgramStep = {
  day: number;
  title: string;
  focus: string;
  tasks: string[];
  estimatedTime: string;
  whyItMatters: string;
  keyTakeaway: string;
};

export const programSteps: ProgramStep[] = [
  {
    day: 1,
    title: "Understand Your Starting Point",
    focus: "Review your current gambling habits, recent decisions and reasons for wanting more control.",
    tasks: ["Review recent activity", "Write down your goal", "Rate urge 1-10"],
    estimatedTime: "3 min",
    whyItMatters: "Many gambling decisions happen automatically. A clear starting point makes the next steps more useful.",
    keyTakeaway: "Know where you are before deciding where to go next.",
  },
  {
    day: 2,
    title: "Identify Personal Triggers",
    focus: "Notice situations, emotions or patterns that can make gambling decisions less deliberate.",
    tasks: ["List triggers", "Check mood", "Name pressure points"],
    estimatedTime: "3 min",
    whyItMatters: "Recognizing triggers can help you pause before a decision becomes automatic.",
    keyTakeaway: "Triggers are signals to slow down, not instructions to continue.",
  },
  {
    day: 3,
    title: "Know How Bonuses Work",
    focus: "Learn the basic terms behind bonuses, including wagering, max bet rules and expiry windows.",
    tasks: ["Read wagering", "Check max bet", "Check expiry"],
    estimatedTime: "3 min",
    whyItMatters: "A bonus can change behavior if the terms are unclear or create pressure to play longer.",
    keyTakeaway: "A larger headline is not always a better offer.",
  },
  {
    day: 4,
    title: "Set Financial Limits",
    focus: "Define a budget, deposit cap and stop-loss before opening a gambling site.",
    tasks: ["Deposit cap", "Stop-loss", "No-borrowing rule"],
    estimatedTime: "3 min",
    whyItMatters: "Financial limits are most useful when they are decided before emotion or losses appear.",
    keyTakeaway: "The limit is part of the plan, not something to adjust mid-session.",
  },
  {
    day: 5,
    title: "Set Time Limits",
    focus: "Choose when a session starts, when it ends and what happens when time is up.",
    tasks: ["Session timer", "Break rule", "End point"],
    estimatedTime: "2 min",
    whyItMatters: "Time limits reduce drift and help keep gambling from spreading across the day.",
    keyTakeaway: "A session should have an ending before it begins.",
  },
  {
    day: 6,
    title: "Recognize Emotional Decisions",
    focus: "Check whether stress, boredom, frustration or losses are influencing the next decision.",
    tasks: ["Mood check", "Loss check", "Pause rule"],
    estimatedTime: "3 min",
    whyItMatters: "Emotional decisions can make limits feel negotiable and bonus terms easier to ignore.",
    keyTakeaway: "If the decision feels urgent, pause before continuing.",
  },
  {
    day: 7,
    title: "Build a Personal Gambling Plan",
    focus: "Write a simple plan that defines when gambling is acceptable and when it should stop.",
    tasks: ["Play reason", "Stop signals", "Session rules"],
    estimatedTime: "4 min",
    whyItMatters: "A written plan makes decisions easier to review before and after a session.",
    keyTakeaway: "Personal rules are easier to follow when they are written down.",
  },
  {
    day: 8,
    title: "Learn Responsible Gambling Tools",
    focus: "Understand deposit limits, cool-off periods, self-exclusion and support options.",
    tasks: ["Deposit limits", "Cool-off", "Self-exclusion"],
    estimatedTime: "3 min",
    whyItMatters: "Tools are easier to use when you understand them before they are urgently needed.",
    keyTakeaway: "Support tools are part of planning, not a sign of failure.",
  },
  {
    day: 9,
    title: "Review Your Plan",
    focus: "Check whether your limits, triggers and bonus understanding still make sense together.",
    tasks: ["Review rules", "Check limits", "Adjust plan"],
    estimatedTime: "3 min",
    whyItMatters: "Reviewing the plan helps catch contradictions before real money is involved.",
    keyTakeaway: "A good plan should be clear enough to follow under pressure.",
  },
  {
    day: 10,
    title: "Make an Informed Decision",
    focus: "Decide whether to pause, continue learning or compare casino information with clear boundaries.",
    tasks: ["Pause option", "Education option", "Comparison option"],
    estimatedTime: "3 min",
    whyItMatters: "The final step is not to push action. It is to make the next choice more deliberate.",
    keyTakeaway: "The most informed decision may be to wait.",
  },
];
