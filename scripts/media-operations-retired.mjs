const command = process.argv.slice(2).join(" ") || "legacy media operation";

process.stderr.write(
  `MEDIA_OPERATIONS_RETIRED: ${command} cannot run. `
  + "Use media-retirement:verify for the read-only logo/retirement audit.\n",
);
process.exitCode = 2;
