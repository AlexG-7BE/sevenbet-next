# SevenBet Agent Instructions

## Documentation First

Documentation has priority over code. Do not implement work until its governing documentation has been reviewed and the work is aligned with it.

## Required Reading

Before beginning any work, study:

1. [Product Vision & Principles](docs/Product-Vision-and-Principles.md)
2. [Project State](docs/PROJECT_STATE.md)
3. [Roadmap](docs/ROADMAP.md)

## Source of Truth

Product Vision & Principles is the primary project document. Functionality that conflicts with it must not be implemented.

## Decision Documentation

All architecture decisions must be documented. All substantial product, architecture, compliance, engineering, or business changes must pass through an RFC before implementation.

## Working Rule

When documentation and code conflict, follow the approved documentation and raise the inconsistency through the appropriate RFC or decision record.

## Technical Documentation Evidence Rule

The factual implementation baseline is maintained at `docs/05_Engineering/Technical_Baseline/`. It is distinct from target architecture in `docs/02_Product_Architecture/` and from engineering standards in `docs/05_Engineering/`.

Before creating or updating technical documentation:

1. Scan the entire active repository and confirm its root.
2. Exclude dependencies, generated directories, build artefacts, caches, and `tsconfig.tsbuildinfo` from source analysis where appropriate.
3. Base implementation claims only on repository evidence.
4. Classify conclusions clearly as **Detected**, **Inferred**, **Planned**, or **Not detected**.
5. Never present planned functionality as implemented and never expose secret values.
6. Stop rather than generate incomplete technical documentation when repository access is insufficient.
