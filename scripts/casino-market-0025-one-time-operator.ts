import {
  CasinoMarket0025OperatorError,
  parseCasinoMarket0025OperatorArguments,
  runCasinoMarket0025Operator,
} from "../lib/db/casino-market-0025-operator";

async function main() {
  const arguments_ = parseCasinoMarket0025OperatorArguments(process.argv.slice(2));
  await runCasinoMarket0025Operator({
    ...arguments_,
    authority: "production",
  });
}

main().catch((error: unknown) => {
  const code = error instanceof CasinoMarket0025OperatorError
    ? error.code
    : "UNEXPECTED_OPERATOR_FAILURE";
  process.stderr.write(`${JSON.stringify({
    event: "casino_market_0025_operator_refused",
    timestamp: new Date().toISOString(),
    code,
    mutationStatus: "not_confirmed",
  })}\n`);
  process.exitCode = 1;
});
