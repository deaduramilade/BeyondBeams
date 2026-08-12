# Consequential-Action Safeguards

**Status:** Authorization-policy baseline only; no production review or appeal workflow

## Implemented boundary

The current agents return simulated outcomes. `/execute` requires validated identity, an externally signed A2SPA-R envelope, durable local nonce consumption, a signed active policy decision, and signed receipt/audit evidence. Policy rules deny by default, give deny rules precedence, bind exact purposes and principal types, expose stable reason codes, require notice/human-review/appeal/remedy flags for permitted rules, and may require an authorized approval role. Exact approval fields are validated and a principal cannot approve its own action.

These controls authorize prototype execution; they do not establish that a reviewer was trained, conflict-free, institutionally authorized, or independent. A receipt records processing but is not a legal or factual decision.

## Production workflow requirements

A production workflow must persist a case state machine for recommendation, pending review, approved/denied decision, notice, correction, appeal, remedy, override, and closure. It must verify reviewer identity, delegated role, tenant, assignment, conflicts, recusal, separation of duties, deadlines, and prohibited uses. Manual overrides require scoped authority, justification reason code, before/after values, expiry, dual approval where risk requires it, immutable audit, and retrospective review.

The operating institution must approve reason-code definitions and intelligible explanations; accessible intake and status channels; correction of source data; conflict-free reassignment; escalation and appeal levels; outcome-quality, error, disparity, timeliness, override, and remedy measures; privacy-preserving synthetic or approved test data; retention; and shutdown triggers. Models may produce recommendations only. The accountable authorized official or governed service records the decision.