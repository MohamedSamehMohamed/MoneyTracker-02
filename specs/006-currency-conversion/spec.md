# Feature Specification: Exchange Rates & Currency Conversion

**Feature Branch**: `006-currency-conversion`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "Phase 5 — Exchange Rates & Currency Conversion"

## Clarifications

### Session 2026-03-27

- Q: How should gold accounts factor into currency conversion and net worth? → A: Gold accounts store balances in grams; the system converts grams to EGP price using gold spot prices, then applies standard currency conversion from EGP to the user's base currency if needed.
- Q: What rate fetching strategy should the system use? → A: Fetch all rates relative to one reference currency (e.g., USD) and derive cross-rates mathematically from those.
- Q: Should cross-currency transfers record the exchange rate used? → A: Deferred to a future phase. Cross-currency transfers are flagged as needing rate data but not implemented in this phase.
- Q: Should manual rate overrides apply retroactively to historical transaction conversions? → A: No. Manual overrides apply only to current/future conversions (dashboard, net worth). Historical transaction conversions always use the rate closest to the transaction date.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Total Net Worth in Base Currency (Priority: P1)

A user who holds accounts in multiple currencies (e.g., EGP, USD, EUR) wants to see their total net worth converted to their chosen base currency on the dashboard. This gives them a single, unified view of their financial position without needing to manually calculate conversions.

**Why this priority**: This is the core value proposition of the feature — users with multi-currency accounts cannot currently understand their total financial position at a glance.

**Independent Test**: Can be fully tested by creating accounts in different currencies, setting exchange rates, and verifying the dashboard displays a correct aggregated total in the user's base currency.

**Acceptance Scenarios**:

1. **Given** a user has accounts in EGP, USD, and EUR with known balances, **When** they view their dashboard, **Then** they see their total net worth displayed in their base currency using current exchange rates.
2. **Given** exchange rates have been updated, **When** the user refreshes the dashboard, **Then** the net worth reflects the latest rates.
3. **Given** a user has only accounts in their base currency, **When** they view the dashboard, **Then** the net worth displays normally without any conversion applied.

---

### User Story 2 - Automatic Exchange Rate Updates (Priority: P1)

The system periodically fetches current exchange rates from an external provider so that conversions are accurate and up-to-date without requiring manual input from the user.

**Why this priority**: Without current rates, all conversions are meaningless. This is a prerequisite for every other story in this feature.

**Independent Test**: Can be tested by triggering a rate fetch and verifying that rates for relevant currency pairs are stored and timestamped correctly.

**Acceptance Scenarios**:

1. **Given** the system is configured with supported currencies, **When** exchange rates are due for refresh, **Then** the system fetches and stores the latest rates from the external provider.
2. **Given** the external rate provider is unavailable, **When** a fetch is attempted, **Then** the system retains the most recently fetched rates and logs the failure.
3. **Given** rates have been fetched, **When** a user or the system requests a conversion, **Then** the most recent rate for that currency pair is used.

---

### User Story 3 - View Exchange Rates (Priority: P2)

A user wants to view the current exchange rates between their relevant currencies so they can understand the conversion factors being applied to their balances and transactions.

**Why this priority**: Transparency builds trust — users need to verify the rates being used before relying on converted figures.

**Independent Test**: Can be tested by navigating to an exchange rates view and confirming it displays current rates for the user's relevant currency pairs.

**Acceptance Scenarios**:

1. **Given** the system has fetched exchange rates, **When** the user navigates to the exchange rates view, **Then** they see rates for all currency pairs relevant to their accounts.
2. **Given** rates were last fetched at a specific time, **When** the user views rates, **Then** the "last updated" timestamp is displayed.

---

### User Story 4 - Convert Transaction Amounts for Reporting (Priority: P2)

A user wants to view their transaction history and reports with amounts converted to their base currency, so they can compare spending and income across accounts in different currencies.

**Why this priority**: Reporting in a single currency enables meaningful financial analysis across multi-currency accounts.

**Independent Test**: Can be tested by viewing a transaction list filtered to show converted amounts and verifying the math against known exchange rates at the transaction date.

**Acceptance Scenarios**:

1. **Given** a user has transactions in USD and their base currency is EGP, **When** they view the transaction list with conversion enabled, **Then** each transaction displays both the original amount and the converted amount in EGP.
2. **Given** a transaction occurred on a past date, **When** it is converted, **Then** the system uses the exchange rate closest to that transaction's date (historical rate).
3. **Given** no historical rate exists for a transaction's date, **When** conversion is attempted, **Then** the system uses the nearest available rate and indicates this to the user.

---

### User Story 5 - Change Base Currency Preference (Priority: P3)

A user wants to change their base currency preference so that all conversions, net worth, and reports reflect the new chosen currency.

**Why this priority**: Flexibility for users who relocate or prefer a different reporting currency. Lower priority because the default (EGP) serves most users initially.

**Independent Test**: Can be tested by changing the base currency in settings and verifying all converted values update accordingly.

**Acceptance Scenarios**:

1. **Given** a user's base currency is EGP, **When** they change it to USD in their settings, **Then** all dashboard totals, reports, and conversions now display in USD.
2. **Given** a user changes their base currency, **When** they view past transaction conversions, **Then** those conversions use the new base currency with appropriate historical rates.

---

### User Story 6 - Manual Rate Override (Priority: P3)

A user wants to manually set or override an exchange rate for a specific currency pair, useful when they know the actual rate they received (e.g., from a money exchange) differs from the market rate.

**Why this priority**: Provides accuracy for real-world transactions where the user's actual rate differs from published rates.

**Independent Test**: Can be tested by manually entering a rate and verifying it overrides the automatic rate for conversions involving that pair.

**Acceptance Scenarios**:

1. **Given** the system has an automatic rate of 1 USD = 50 EGP, **When** the user sets a manual override of 1 USD = 49.5 EGP, **Then** conversions for that pair use 49.5 until the override is removed.
2. **Given** a manual override is active, **When** the user removes it, **Then** the system reverts to using automatically fetched rates.

---

### Edge Cases

- What happens when the system has no exchange rate data at all (first-time use before any rates are fetched)? The system displays unconverted balances and prompts the user that rate data is pending.
- How does the system handle currencies not supported by the external rate provider? The system notifies the user and allows manual rate entry for unsupported pairs.
- What happens when a user creates an account with a new currency that has no existing rate data? The system triggers a rate fetch for the new currency pair and displays a "pending" indicator until rates are available.
- How does the system behave if the external rate provider returns clearly erroneous data (e.g., a rate of 0 or negative)? The system rejects the data, retains previous valid rates, and logs the anomaly.
- What happens when two accounts use the same currency but one has a manual rate override — does the override apply globally? Yes, manual overrides apply per currency pair across all accounts for that user.
- How are gold accounts handled in net worth calculations? Gold balances (in grams) are converted to EGP using the current gold spot price per gram, then EGP is converted to the user's base currency if needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the user's total net worth in their chosen base currency on the dashboard, aggregating balances from all accounts using current exchange rates.
- **FR-002**: System MUST automatically fetch and store exchange rates from an external provider at a configurable interval (default: every 6 hours). Rates are fetched relative to a single reference currency (e.g., USD); cross-rates between other currencies are derived mathematically.
- **FR-003**: System MUST support conversion between all currency pairs present in the user's accounts.
- **FR-003a**: System MUST fetch gold spot prices (per gram in EGP) alongside forex rates, and convert gold account balances (stored in grams) to EGP value for net worth aggregation and reporting.
- **FR-004**: System MUST retain historical exchange rates so that past transactions can be converted using the rate closest to their transaction date.
- **FR-005**: System MUST display the original amount and the converted amount when showing transactions in a currency different from the user's base currency.
- **FR-006**: System MUST allow users to view current exchange rates for their relevant currency pairs, including a "last updated" timestamp.
- **FR-007**: System MUST allow users to change their base currency preference, and all converted displays must update accordingly.
- **FR-008**: System MUST allow users to manually set an exchange rate override for a specific currency pair. Manual overrides apply only to current/future conversions (dashboard net worth, current balance views); historical transaction conversions always use the rate closest to the transaction date.
- **FR-009**: System MUST gracefully handle external rate provider failures by retaining and using the most recently fetched rates.
- **FR-010**: System MUST validate fetched rates (reject zero, negative, or clearly anomalous values) before storing them.
- **FR-011**: System MUST indicate to the user when a conversion uses an approximate or dated rate (e.g., when no exact-date rate is available).
- **FR-012**: When no exchange rate data exists for a currency pair, the system MUST display unconverted amounts and notify the user that conversion is unavailable.

### Key Entities

- **Exchange Rate**: Represents the conversion factor between two currencies (or gold-to-EGP) at a point in time. Key attributes: source currency, target currency, rate value, timestamp, source (automatic or manual).
- **User Currency Preference**: The user's chosen base currency for aggregated views and reports. Linked to the user profile.
- **Rate Override**: A user-defined exchange rate for a specific currency pair that takes precedence over automatically fetched rates. Key attributes: currency pair, override rate, active/inactive status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with multi-currency accounts can view their total net worth in their base currency within 2 seconds of loading the dashboard.
- **SC-002**: Exchange rates are updated automatically at least 4 times per day without user intervention.
- **SC-003**: 100% of displayed conversions use rates no older than 24 hours (unless no newer rate is available, in which case the age is disclosed).
- **SC-004**: Users can change their base currency and see all values update within 3 seconds.
- **SC-005**: Users can manually override an exchange rate in under 30 seconds.
- **SC-006**: Historical transaction conversions use the rate closest to the transaction date, with accuracy within one calendar day.
- **SC-007**: When the external rate provider is unavailable, users experience no disruption — existing rates continue to be used seamlessly.

## Assumptions

- The user's base currency is already stored in their profile (currently defaults to "EGP").
- Accounts already have a `currency` field, so the system knows which currencies are in use.
- An exchange rate data model already exists with fields for source currency, target currency, rate, fetched timestamp, and source identifier.
- The set of supported currencies is determined by the currencies actually used in user accounts, not a predefined fixed list.
- Exchange rates are fetched relative to a single reference currency (e.g., USD); cross-rates are computed as needed rather than stored individually for every pair.
- Exchange rate fetch frequency of every 6 hours is a reasonable default; this can be adjusted later.
- Manual rate overrides apply globally to the user for that currency pair (not per-account).
- The external rate provider offers a free or freemium tier sufficient for the application's needs.

## Out of Scope

- Recording exchange rates at cross-currency transfer time (deferred to a future phase).
- Commodity trading or gold buy/sell transaction features (this phase only converts gold gram balances to currency value for reporting).

## Dependencies

- External exchange rate data provider (for automatic rate fetching).
- Existing user profile with base currency preference.
- Existing account model with currency field.
- Existing exchange rate data model.
