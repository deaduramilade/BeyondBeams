# Accessibility and Service Inclusion

**Status:** Engineering baseline implemented; independent conformance not demonstrated

## Implemented baseline

The PWA uses semantic headings, buttons, labels, a skip link, visible keyboard focus, live regions for status and errors, reduced-motion handling, responsive layouts, and English/French interface strings selected from browser language or the on-page selector. Token entry no longer uses browser prompts; credentials are not placed in browser storage and the token field is cleared after each request. The application shell remains available from cache, while action submission fails clearly when offline.

The interface distinguishes simulated recommendations from decisions and states that the prototype cannot accept real appeals or provide a manual service route. This prevents a missing institutional service channel from being represented as implemented.

## Required assessment

Before public use, an independent qualified assessor must test the approved deployment against the institution's required WCAG version and conformance level. Evidence must include keyboard-only operation, focus order, zoom/reflow, contrast, error recovery, screen-reader combinations, speech input where applicable, assistive-technology compatibility, browser/device coverage, localization quality, low-bandwidth and interrupted-network behavior, installability, notices, appeal/status flows, and accessible documents.

Testing must name browser, version, operating system, device, assistive technology, language, network profile, findings, severity, remediation, retest result, assessor, scope, and date. Automated source tests are regression checks only and are not a WCAG assessment.

## Responsive acceptance

Phase 1 engineering must cover representative viewport widths of 320, 375, 768, 1024, 1280, 1440, and 1920 CSS pixels. Mobile forms must remain usable with touch, screen readers, and the virtual keyboard; tablet journeys must work in portrait and landscape; desktop and widescreen layouts must constrain readable content while using additional space for useful queue/detail views. Navigation, forms, tables, dialogs, evidence, status, and recovery controls must not overlap, clip text, hide actions, or require horizontal page scrolling.

Where optional JSON payload entry is provided, an accessible input-method radio group must select the guided form by default. The JSON textarea must remain hidden or disabled until the JSON option is selected, expose its enabled and error state to assistive technology, preserve a logical focus order, and provide labelled syntax and schema errors. Selecting the guided form again must disable JSON submission predictably. The control and its validation messages must reflow across mobile, tablet, desktop, widescreen, zoom, localization, touch, keyboard, and screen-reader use.

Phase 2 repeats the complete assessment against the named institution's supported physical phones, tablets, desktop browsers, widescreen displays, languages, content, identity provider, and service workflows. It must include portrait/landscape rotation, 200% and 400% zoom/reflow, localization expansion, low bandwidth, interruption, and session-expiry recovery. Passing source-level responsive checks is not evidence that the configured live service is accessible or usable.

## Institutional service path

Each deployment must publish accessible digital and non-digital contact, correction, objection, human-review, appeal, status, escalation, and complaint routes. Notices must identify responsible authority, available formats and languages, expected response process, urgent alternatives, and accommodations without requiring the affected person to use this PWA. No contact details are invented in this repository.