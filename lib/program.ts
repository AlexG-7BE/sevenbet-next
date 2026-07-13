export type ProgramStep = {
  stableId?: string;
  day: number;
  title: string;
  focus: string;
  tasks: string[];
  estimatedTime: string;
  whyItMatters: string;
  keyTakeaway: string;
  lesson: string;
  exercisePrompt: string;
  scenario: {
    prompt: string;
    options: Array<{ label: string; feedback: string; recommended?: boolean }>;
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  recap: string[];
  xp: {
    lesson: number;
    scenario: number;
    quiz: number;
    guide: number;
  };
};

export const programSteps: ProgramStep[] = [
  {
    day: 1,
    title: "Understand Your Starting Point",
    focus: "Review your current gambling habits, recent decisions and reasons for wanting more control.",
    tasks: ["Review recent activity", "Write down your goal", "Rate urge 1-10"],
    estimatedTime: "5-10 min",
    whyItMatters: "Many gambling decisions happen automatically. A clear starting point makes the next steps more useful.",
    keyTakeaway: "Know where you are before deciding where to go next.",
    lesson: "Start by naming the situation honestly. This step is not about judgment; it is about creating a clear baseline before any casino comparison or bonus decision.",
    exercisePrompt: "Write one sentence that describes why you want more control before gambling decisions.",
    scenario: {
      prompt: "You notice you are opening casino comparison pages without a clear plan. What is the most useful first move?",
      options: [
        { label: "Pick the largest welcome offer", feedback: "Headline offer size does not create a starting point." },
        { label: "Pause and write your current goal", feedback: "Good. A written goal makes the next steps more grounded.", recommended: true },
        { label: "Skip to casino reviews", feedback: "Reviews are more useful after your own baseline is clear." },
      ],
    },
    quiz: {
      question: "Why does the program start with a baseline?",
      options: ["To predict outcomes", "To understand current habits before decisions", "To choose a casino faster"],
      correctIndex: 1,
      explanation: "A baseline helps you understand current habits before making more decisions.",
    },
    recap: ["Name the current situation.", "Write a goal.", "Use the goal before comparing offers."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 2,
    title: "Identify Personal Triggers",
    focus: "Notice situations, emotions or patterns that can make gambling decisions less deliberate.",
    tasks: ["List triggers", "Check mood", "Name pressure points"],
    estimatedTime: "5-10 min",
    whyItMatters: "Recognizing triggers can help you pause before a decision becomes automatic.",
    keyTakeaway: "Triggers are signals to slow down, not instructions to continue.",
    lesson: "A trigger is any situation that makes gambling feel more automatic: boredom, stress, losses, bonus urgency, or a specific time of day.",
    exercisePrompt: "List one trigger that has made gambling decisions feel faster or less planned.",
    scenario: {
      prompt: "You feel frustrated after a loss and want to review more bonuses immediately. What should happen first?",
      options: [
        { label: "Open several new casino tabs", feedback: "That can increase urgency instead of reducing it." },
        { label: "Pause and name the trigger", feedback: "Good. Naming the trigger creates space before the next action.", recommended: true },
        { label: "Increase the budget", feedback: "Changing limits under pressure weakens the plan." },
      ],
    },
    quiz: {
      question: "A trigger should be treated as...",
      options: ["A signal to slow down", "A reason to keep playing", "Proof that a bonus is better"],
      correctIndex: 0,
      explanation: "Triggers are signals to pause and review the plan.",
    },
    recap: ["Triggers can be emotional or situational.", "Naming a trigger reduces automatic action.", "Pressure is a reason to pause."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 3,
    title: "Know How Bonuses Work",
    focus: "Learn the basic terms behind bonuses, including wagering, max bet rules and expiry windows.",
    tasks: ["Read wagering", "Check max bet", "Check expiry"],
    estimatedTime: "5-10 min",
    whyItMatters: "A bonus can change behavior if the terms are unclear or create pressure to play longer.",
    keyTakeaway: "A larger headline is not always a better offer.",
    lesson: "A welcome bonus is only useful to compare when you understand wagering, eligible games, expiry, maximum bet rules, and withdrawal restrictions.",
    exercisePrompt: "Write the three bonus terms you would check before considering any welcome offer.",
    scenario: {
      prompt: "Two offers are listed: one has a larger headline amount, the other has clearer terms and lower wagering. What should you compare first?",
      options: [
        { label: "Only the largest bonus amount", feedback: "The headline amount can be misleading without terms." },
        { label: "Wagering, expiry, and restrictions", feedback: "Good. Terms explain how demanding an offer may be.", recommended: true },
        { label: "Only the casino logo", feedback: "Brand presentation is not enough for comparison." },
      ],
    },
    quiz: {
      question: "What does a wagering requirement describe?",
      options: ["Possible required qualifying play", "A guaranteed withdrawal", "A license number"],
      correctIndex: 0,
      explanation: "Wagering describes possible qualifying play required under bonus terms.",
    },
    recap: ["Headline value is not enough.", "Check wagering and expiry.", "Do not change limits because of a bonus."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 4,
    title: "Set Financial Limits",
    focus: "Define a budget, deposit cap and stop-loss before opening a gambling site.",
    tasks: ["Deposit cap", "Stop-loss", "No-borrowing rule"],
    estimatedTime: "5-10 min",
    whyItMatters: "Financial limits are most useful when they are decided before emotion or losses appear.",
    keyTakeaway: "The limit is part of the plan, not something to adjust mid-session.",
    lesson: "A financial limit is a boundary chosen before a session, not a flexible target. It should never include money needed for essentials.",
    exercisePrompt: "Write a simple no-borrowing rule and one deposit cap you would not change during a session.",
    scenario: {
      prompt: "You reach your planned deposit cap, but a bonus is still available. What should you do?",
      options: [
        { label: "Raise the cap to match the bonus", feedback: "Changing the cap under pressure weakens the limit." },
        { label: "Keep the cap unchanged", feedback: "Good. The limit comes from your plan, not from the offer.", recommended: true },
        { label: "Borrow for one more deposit", feedback: "Borrowed money should not be used for gambling." },
      ],
    },
    quiz: {
      question: "When is the best time to set a deposit limit?",
      options: ["Before the session", "After a loss", "When an offer expires soon"],
      correctIndex: 0,
      explanation: "Limits work best when set before emotion or urgency appears.",
    },
    recap: ["Protect essential money.", "Set limits before sessions.", "Do not borrow to gamble."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 5,
    title: "Set Time Limits",
    focus: "Choose when a session starts, when it ends and what happens when time is up.",
    tasks: ["Session timer", "Break rule", "End point"],
    estimatedTime: "5-10 min",
    whyItMatters: "Time limits reduce drift and help keep gambling from spreading across the day.",
    keyTakeaway: "A session should have an ending before it begins.",
    lesson: "Time boundaries reduce drift. A planned ending makes it easier to stop without turning one decision into a long session.",
    exercisePrompt: "Write one session end rule, such as a time limit or number of reminders.",
    scenario: {
      prompt: "Your planned session timer goes off, but you feel close to meeting a bonus requirement. What is the strongest action?",
      options: [
        { label: "Ignore the timer", feedback: "Ignoring the timer makes the rule less useful." },
        { label: "Stop and review the plan", feedback: "Good. A timer is a decision point, not background noise.", recommended: true },
        { label: "Double the session length", feedback: "Extending under pressure can create drift." },
      ],
    },
    quiz: {
      question: "Why set an end point before a session starts?",
      options: ["To reduce drift", "To make bonuses larger", "To avoid reading terms"],
      correctIndex: 0,
      explanation: "An end point reduces session drift and supports planned decisions.",
    },
    recap: ["Set a start and end.", "Treat reminders as decision points.", "Do not extend because of pressure."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 6,
    title: "Recognize Emotional Decisions",
    focus: "Check whether stress, boredom, frustration or losses are influencing the next decision.",
    tasks: ["Mood check", "Loss check", "Pause rule"],
    estimatedTime: "5-10 min",
    whyItMatters: "Emotional decisions can make limits feel negotiable and bonus terms easier to ignore.",
    keyTakeaway: "If the decision feels urgent, pause before continuing.",
    lesson: "Emotional decisions can make rules feel negotiable. The goal is to notice the emotion before it changes the plan.",
    exercisePrompt: "Write one emotion that should trigger a pause before any gambling decision.",
    scenario: {
      prompt: "You feel bored and want to register quickly just to do something. What is a useful check?",
      options: [
        { label: "Ask whether this matches the written plan", feedback: "Good. The plan helps separate boredom from intention.", recommended: true },
        { label: "Choose the fastest signup", feedback: "Speed is not the same as a considered decision." },
        { label: "Skip payment checks", feedback: "Payment rules still matter." },
      ],
    },
    quiz: {
      question: "If a decision feels urgent, the program suggests...",
      options: ["Pausing first", "Increasing the budget", "Ignoring terms"],
      correctIndex: 0,
      explanation: "Urgency is a cue to pause and review the plan.",
    },
    recap: ["Emotions can affect rules.", "Urgency is a pause cue.", "Use the written plan as a check."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 7,
    title: "Build a Personal Gambling Plan",
    focus: "Write a simple plan that defines when gambling is acceptable and when it should stop.",
    tasks: ["Play reason", "Stop signals", "Session rules"],
    estimatedTime: "5-10 min",
    whyItMatters: "A written plan makes decisions easier to review before and after a session.",
    keyTakeaway: "Personal rules are easier to follow when they are written down.",
    lesson: "A personal plan should be short enough to use. It can include budget, time, triggers, bonus rules, and stop signals.",
    exercisePrompt: "Write one sentence that defines when you should stop, even if you still want to continue.",
    scenario: {
      prompt: "Your plan says no gambling when stressed, but you are stressed and browsing reviews. What should happen?",
      options: [
        { label: "Follow the plan and pause", feedback: "Good. A plan matters most when it is inconvenient.", recommended: true },
        { label: "Create an exception", feedback: "Frequent exceptions weaken the plan." },
        { label: "Only read bonus headlines", feedback: "Headlines can still create pressure." },
      ],
    },
    quiz: {
      question: "A useful personal plan should be...",
      options: ["Clear enough to follow under pressure", "Long and hard to remember", "Focused only on bonuses"],
      correctIndex: 0,
      explanation: "The plan should be simple enough to use when decisions are harder.",
    },
    recap: ["Write rules clearly.", "Include stop signals.", "Avoid exceptions under pressure."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 8,
    title: "Learn Responsible Gambling Tools",
    focus: "Understand deposit limits, cool-off periods, self-exclusion and support options.",
    tasks: ["Deposit limits", "Cool-off", "Self-exclusion"],
    estimatedTime: "5-10 min",
    whyItMatters: "Tools are easier to use when you understand them before they are urgently needed.",
    keyTakeaway: "Support tools are part of planning, not a sign of failure.",
    lesson: "Responsible gambling tools can help create friction, pause access, or set boundaries. Availability and details depend on the operator and jurisdiction.",
    exercisePrompt: "Choose one tool you would review before depositing: deposit limit, cooling-off, reality check, or self-exclusion.",
    scenario: {
      prompt: "You have ignored your own limit several times. Which tool may deserve closer review?",
      options: [
        { label: "Another bonus", feedback: "Another offer does not address the ignored limit." },
        { label: "Cooling-off or self-exclusion information", feedback: "Good. Stronger pause tools may be more relevant.", recommended: true },
        { label: "A faster payment method", feedback: "Payment speed does not solve control issues." },
      ],
    },
    quiz: {
      question: "Responsible gambling tools are best understood...",
      options: ["Before they are urgently needed", "Only after choosing a bonus", "Only after registration"],
      correctIndex: 0,
      explanation: "Tools are easier to use when understood in advance.",
    },
    recap: ["Tools create boundaries.", "Availability varies.", "Review tools before depositing."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 9,
    title: "Review Your Plan",
    focus: "Check whether your limits, triggers and bonus understanding still make sense together.",
    tasks: ["Review rules", "Check limits", "Adjust plan"],
    estimatedTime: "5-10 min",
    whyItMatters: "Reviewing the plan helps catch contradictions before real money is involved.",
    keyTakeaway: "A good plan should be clear enough to follow under pressure.",
    lesson: "Plans need review. A limit, trigger rule, and bonus rule should work together instead of contradicting each other.",
    exercisePrompt: "Write one part of your plan that may need to be clearer before comparing casinos.",
    scenario: {
      prompt: "Your plan has a budget limit, but no time limit. What should you add?",
      options: [
        { label: "A session end rule", feedback: "Good. Money and time boundaries work together.", recommended: true },
        { label: "A larger bonus target", feedback: "A target does not replace a boundary." },
        { label: "A rule to skip terms", feedback: "Terms are part of informed comparison." },
      ],
    },
    quiz: {
      question: "A plan review is useful because it can reveal...",
      options: ["Contradictions before real decisions", "Guaranteed results", "Which casino will pay fastest"],
      correctIndex: 0,
      explanation: "A review can catch unclear or conflicting rules before real decisions.",
    },
    recap: ["Check for contradictions.", "Clarify vague rules.", "Review before comparing."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
  {
    day: 10,
    title: "Make an Informed Decision",
    focus: "Decide whether to pause, continue learning or compare casino information with clear boundaries.",
    tasks: ["Pause option", "Education option", "Comparison option"],
    estimatedTime: "5-10 min",
    whyItMatters: "The final step is not to push action. It is to make the next choice more deliberate.",
    keyTakeaway: "The most informed decision may be to wait.",
    lesson: "The final step is a decision checkpoint. Continuing to learn, pausing, or comparing reviews can all be valid choices depending on your plan.",
    exercisePrompt: "Choose your next action: pause today, continue learning, or compare reviews with written limits.",
    scenario: {
      prompt: "You completed the program but feel unsure about your limits. What is the best next step?",
      options: [
        { label: "Pause and continue learning", feedback: "Good. Uncertainty is a valid reason to wait.", recommended: true },
        { label: "Register immediately", feedback: "Completion is not a push to register." },
        { label: "Ignore the plan", feedback: "The plan exists to guide the next decision." },
      ],
    },
    quiz: {
      question: "What can be an informed final decision?",
      options: ["Waiting", "Always registering", "Ignoring limits"],
      correctIndex: 0,
      explanation: "The most informed decision may be to wait or continue learning.",
    },
    recap: ["Completion is not pressure.", "Choose the next step calmly.", "Waiting can be informed."],
    xp: { lesson: 10, scenario: 15, quiz: 15, guide: 10 },
  },
];
