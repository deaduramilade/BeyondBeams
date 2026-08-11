# Disaster Recovery

## Current limitation

The prototype has no persistent application database or formal backup system. Source is in GitHub; keys and future audit/data stores must never be assumed recoverable from Git. No RTO or RPO has been approved.

## Recovery assets

Maintain protected copies of source/tag references, immutable artifacts, deployment definitions, dependency lockfiles, encrypted key backups where policy permits, secret-manager configuration, audit records, and platform configuration. Apply separation of duties and test restoration.

## Required planning

Service owners must complete a business-impact analysis and approve RTO/RPO per component. Define regional/data-sovereignty constraints, backup frequency, retention, encryption, access, restoration order, degraded-mode behavior, and communications.

## Recovery sequence

Declare the event; protect evidence; establish trusted control-plane access; restore networking and secret services; deploy a verified artifact; restore state in dependency order; rotate credentials if integrity is uncertain; validate authorization, audit, and data consistency; then reopen traffic with heightened monitoring.

## Exercises

Conduct tabletop exercises at least semiannually and technical restore tests at a risk-approved cadence. Record measured recovery times, data loss, control failures, owners, and deadlines. A backup is not accepted until restoration has been demonstrated.