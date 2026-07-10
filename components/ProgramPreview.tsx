import Link from "next/link";
import { programSteps } from "@/lib/program";

export function ProgramPreview() {
  return (
    <div className="programGrid">
      {programSteps.slice(0, 5).map((step) => (
        <article className="programCard" key={step.day}>
          <span className="dayPill">Day {step.day}</span>
          <h3>{step.title}</h3>
          <p className="muted">{step.focus}</p>
          <div className="miniTasks">
            {step.tasks.map((task) => (
              <span key={task}>{task}</span>
            ))}
          </div>
        </article>
      ))}
      <Link className="programCta" href="/program">
        Open all 10 steps
      </Link>
    </div>
  );
}
