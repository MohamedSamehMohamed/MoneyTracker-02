# Data Model: Project Setup & Foundation

**Feature**: 001-project-setup-foundation
**Date**: 2026-03-20

## Overview

This phase has **no data entities** — it is purely project scaffolding. The database, ORM, and data models are introduced in Phase 2.

## Entities

None for this phase.

## Notes

The full data model planned for the application (defined in plan.md Section 4) includes:
- **Users** — authentication and profile
- **Accounts** — money sources (cash, bank, wallet, gold)
- **Transactions** — income, expense, transfer records
- **Categories** — transaction categorization
- **Exchange Rates** — cached currency/gold conversion rates

These will be implemented with Prisma ORM + PostgreSQL in Phase 2.
