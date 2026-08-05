import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "10 Steps Before You Choose | SevenBet",
  description:
    "Build a clearer way to compare casino options, understand offers and set your own rules before you choose.",
  alternates: { canonical: absoluteUrl("/10-steps") },
};

const missions = [
  ["01", "Name the moment", "Save the situation you want to understand before you decide."],
  ["02", "Set the goal", "Choose what would be useful right now: research, pause, learn or decide later."],
  ["03", "Understand the urge", "Recognise a decision signal before it writes the next step for you."],
  ["04", "Build one boundary", "Turn one rule into a clear, reusable part of your plan."],
  ["05", "Check before deciding", "Use terms, sources and uncertainty to check a commercial claim."],
  ["06", "Add friction", "Choose a practical action that makes an impulsive choice less automatic."],
  ["07", "Prepare support", "Keep a support option ready before you need it."],
  ["08", "Research responsibly", "Compare licensed options through criteria that matter to you."],
  ["09", "Rehearse the decision", "Create a simple when / then rule for a likely future moment."],
  ["10", "Review the plan", "Make your personal plan clear enough to use again."],
];

export default function TenStepsPage() {
  return (
    <div className="tenStepsPage">
      <section className="tenStepsHero">
        <div className="tenStepsWrap tenStepsHeroGrid">
          <div>
            <p className="tenStepsKicker">SEVENBET CONTROL PROGRAM · 18+</p>
            <h1>10 steps before you choose.</h1>
            <p className="tenStepsLead">
              Compare casinos, understand offers and build your own rules — with one useful action at a time.
            </p>
            <div className="tenStepsActions">
              <Link className="tenStepsPrimary" href="/program">Start Mission 01</Link>
              <Link className="tenStepsSecondary" href="#the-path">See the 10-step path</Link>
            </div>
            <p className="tenStepsFinePrint">Start privately. Create an account after Mission 01 to save your plan and continue.</p>
          </div>

          <aside className="tenStepsConsole" aria-label="Program preview">
            <div className="tenStepsConsoleTop"><span>YOUR PROGRAM</span><span>UK PREVIEW</span></div>
            <div className="tenStepsMetric"><strong>01</strong><span>of 10 missions</span></div>
            <div className="tenStepsMissionPreview">
              <span className="tenStepsSignal">START HERE</span>
              <h2>Name the moment</h2>
              <p>What happens just before you want to play or compare an offer?</p>
              <div className="tenStepsReward"><span>+ 20 XP</span><span>Unlock: first cue</span></div>
            </div>
            <div className="tenStepsConsoleFoot">Progress lives in your account after Mission 01.</div>
          </aside>
        </div>
      </section>

      <section className="tenStepsProof">
        <div className="tenStepsWrap tenStepsProofGrid">
          <p><strong>10 missions</strong><span>One personal decision system</span></p>
          <p><strong>XP & achievements</strong><span>For Program actions, never for play</span></p>
          <p><strong>UK-ready discovery</strong><span>Casinos, bonuses and best offers</span></p>
        </div>
      </section>

      <section className="tenStepsPath" id="the-path">
        <div className="tenStepsWrap">
          <div className="tenStepsSectionHead">
            <p className="tenStepsKicker">THE PROGRAM PATH</p>
            <h2>Not a checklist. A plan you can return to.</h2>
            <p>Each mission creates something you can use in your Dashboard: a cue, goal, boundary, checklist or decision rule.</p>
          </div>
          <ol className="tenStepsMissionGrid">
            {missions.map(([number, title, text]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="tenStepsCommerce">
        <div className="tenStepsWrap tenStepsCommerceGrid">
          <div>
            <p className="tenStepsKicker">COMMERCIAL DISCOVERY</p>
            <h2>Explore offers without losing the thread.</h2>
            <p>Casinos, bonuses and best offers remain available throughout SevenBet. Your Program progress never changes what an operator offers you.</p>
          </div>
          <div className="tenStepsCommerceLinks">
            <Link href="/casinos"><span>01</span> Casinos <b>→</b></Link>
            <Link href="/bonuses"><span>02</span> Bonuses <b>→</b></Link>
            <Link href="/best-offers"><span>03</span> Best offers <b>→</b></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
