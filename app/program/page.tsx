import { programSteps } from "@/lib/program";

export default function ProgramPage() {
  return (
    <section className="pageShell">
      <div className="container">
        <p className="eyebrow">10-step program</p>
        <h1>10 steps toward controlled betting.</h1>
        <p className="lead">The program structure is already separated into a data layer. Next step: add client progress with localStorage and a daily completion meter.</p>
        <div className="stepTimeline">
          {programSteps.map((step) => (
            <article key={step.day} className="timelineItem">
              <span>Day {step.day}</span>
              <div>
                <h3>{step.title}</h3>
                <p className="muted">{step.focus}</p>
                <div className="miniTasks">
                  {step.tasks.map((task) => <span key={task}>{task}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
