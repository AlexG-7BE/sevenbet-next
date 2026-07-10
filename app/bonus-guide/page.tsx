const items = [
  ["Wagering", "x35 means the bonus amount must be wagered 35 times. Lower requirements are usually easier to control."],
  ["Max bet", "The maximum allowed bet while wagering a bonus. Breaking it can void winnings."],
  ["Expiry", "A short expiry window can push you to play faster and longer than planned."],
  ["Restricted games", "Slots, live casino and table games often contribute differently to wagering."],
  ["Min deposit", "The minimum deposit must fit your limit instead of stretching it."],
  ["Withdrawal rules", "Check KYC, withdrawal limits, fees and payout speed before depositing."],
];

export default function BonusGuidePage() {
  return (
    <section className="pageShell">
      <div className="container">
        <p className="eyebrow">Bonus guide</p>
        <h1>How to read casino bonuses without walking into a trap.</h1>
        <p className="lead">A good bonus should not make you increase your deposit, bet size or session length.</p>
        <div className="guideGrid">
          {items.map(([title, text]) => (
            <article className="guideCard" key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
