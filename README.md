# PatientTriage.ai

PatientTriage.ai — Intelligent Emergency Care Orchestration — is a
single-file, standalone prototype of an emergency department (ED)
clinical decision support and operational intelligence platform. It
was built for the Accenture Innovation Challenge to demonstrate how
deterministic clinical rules (ESI, NEWS2, qSOFA), AI-assisted
assessment, and continuous deterioration monitoring can work
together with a human clinician who always remains in control of the
final decision.

The prototype covers the full patient journey — Registration, Triage,
Clinical Review, Waiting, Treatment, and Disposition — across five
workspaces: Operations, Triage, Monitoring, Capacity, and Analytics.
It runs entirely in the browser with no backend, no database, and no
build step.

- Project page / demo file: [`index.html`](./index.html)
- Issue queue: <https://github.com/YOUR-USERNAME/patienttriage-ai/issues>
- Business proposal: [`docs/business-proposal.pdf`](./docs/business-proposal.pdf)


## Table of contents

- Introduction
- Requirements
- Recommended tools
- Installation
- Configuration
- Screenshots
- Troubleshooting and FAQ
- Maintainers


## Requirements

This project has no runtime dependencies. List of everything needed
to *run* it:

- A modern desktop or mobile web browser with JavaScript enabled
    (Chrome, Edge, Firefox, or Safari — current or previous major
    version). The interface is responsive and has been tested at
    desktop (1600px), tablet (900px), and mobile (420px) widths.
- No server, database, build tool, or package installation is
    required. The entire application — markup, styling, and logic —
    ships as one HTML file.

Everything below this point is *optional* and only needed if you want
to extend the prototype or re-run its automated checks:

- [Node.js](https://nodejs.org/) 18 or later — only required to run
    the optional QA scripts in [`qa/`](./qa).
- [Playwright](https://playwright.dev/) — only required to run the
    optional QA scripts; see Installation below.
- An [Anthropic API key](https://console.anthropic.com/) — only
    required if you want live, model-backed acuity scoring instead of
    the built-in deterministic rule engine and offline heuristic
    fallback (both of which work with no key and no network access).


## Recommended tools

These are not required, but make local development more comfortable:

- A static file server such as `npx serve` or Python's
    `python3 -m http.server`, so the app is served over `http://`
    instead of `file://` (avoids some browsers' stricter `file://`
    security restrictions on clipboard access and web speech APIs).
- A code editor with HTML/CSS/JS support (VS Code, Sublime Text, or
    similar) if you plan to modify the prototype.
- [GitHub Pages](https://pages.github.com/), for hosting a live,
    shareable link to the demo directly from this repository.


## Installation

There is no build step. Choose any one of the following:

1. **Open it directly.** Download or clone this repository, then
    double-click `index.html` (or drag it into an open browser
    window). The app will load at `file:///.../index.html`.

2. **Serve it locally (recommended).** From the repository root, run
    one of:

    ```bash
    npx serve .
    # or
    python3 -m http.server 8080
    ```

    Then open `http://localhost:8080` (or the port shown) in your
    browser.

3. **Publish it with GitHub Pages.** After pushing this repository to
    GitHub, go to *Settings → Pages*, set the source branch to `main`
    and the folder to `/ (root)`, and save. GitHub will publish
    `index.html` at
    `https://YOUR-USERNAME.github.io/patienttriage-ai/`.

4. **Run the optional QA scripts.** These drive the full demo flow
    end-to-end with Playwright and capture screenshots for visual
    regression checks:

    ```bash
    cd qa
    npm install
    node test-happy-path.js
    node test-overrides-and-modals.js
    ```


## Configuration

The application has no environment variables or config files. All
configuration happens inside the running app itself, from the header
icons or the Settings panel:

- **AI service access** — Settings → *AI service access*. Paste an
    Anthropic API key to enable live, model-backed acuity scoring.
    The key is kept in the browser tab's memory only, for that
    session; it is never written to disk or sent anywhere but the
    model API. Leave this blank to use the deterministic clinical
    rule engine and offline heuristic fallback, which work fully
    without any key or network access.
- **Facility profile** — Settings → *Facility profile*. Adjusts
    default bed counts to demonstrate the same assistant scaling
    across differently sized hospitals. It does not change the
    underlying clinical logic.
- **Nurse duty profile** — header avatar → *Nurse Duty Profile*. Sets
    the on-duty nurse name attributed to admissions, overrides, and
    escalations in the audit trail for the current session.
- **Simulation Console** — Operations workspace → *Simulation
    Console*. Loads a batch of synthetic demo patients (clearly
    labeled as simulated) to populate the triage queue for
    demonstration purposes, and includes a simulated-time
    fast-forward control for exercising wait-time breach behavior.
- **Theme** — header sun/moon icon. Toggles between light and dark
    mode; the choice is remembered only for the current session.

State (patients, queue, audit log, simulated clock offset) lives in
memory in the browser tab for the duration of the session, by design
for this prototype — there is no backend to persist it, and reloading
the page starts a fresh session.


## Screenshots

| Operations command center | Decision support & confidence fusion |
| --- | --- |
| ![Operations workspace](./docs/screenshots/operations.png) | ![Decision support](./docs/screenshots/decision-support.png) |

| Continuous deterioration monitor | Capacity command center |
| --- | --- |
| ![Monitoring workspace](./docs/screenshots/monitoring.png) | ![Capacity workspace](./docs/screenshots/capacity.png) |

Additional screenshots, including the override/escalation drawers,
audit log, and tablet/mobile layouts, are in
[`docs/screenshots/`](./docs/screenshots).


## Troubleshooting and FAQ

**The acuity source says "Offline heuristic fallback" instead of an
AI confidence score. Is that a bug?**
No — this is the graceful-degradation behavior described in the
Business Proposal's risk mitigations. If no API key is configured, or
the AI service is unreachable, the app automatically falls back to a
deterministic, rule-based heuristic scorer so clinical decision
support keeps working. This is called out in the UI rather than
hidden.

**I refreshed the page and my patients disappeared.**
This is expected. The prototype keeps all state in memory for
demonstration purposes and has no backend or database — see
Configuration above. Use the Simulation Console to quickly reload a
demo queue.

**`Ctrl+K` does not open the command palette.**
Some browsers or OS-level shortcuts intercept `Ctrl+K` (for example,
address-bar search in some browser configurations). Click the search
box in the header instead, or check your browser's keyboard shortcut
settings.

**Can I use this with real patient data?**
No. This is a demonstration prototype only, not a certified medical
device, and it has no security, authentication, or compliance
controls suitable for real patient information. Do not enter real
identifiable patient data.

**The QA scripts in `qa/` fail to launch a browser.**
They expect a Chromium install reachable by Playwright. Run
`npx playwright install chromium` once after `npm install` if your
environment does not already have a Chromium build available.


## Maintainers

- Vedaant Gupta — [@YOUR-USERNAME](https://github.com/YOUR-USERNAME)

Current maintainer(s):

- Vedaant Gupta - [@YOUR-USERNAME](https://github.com/YOUR-USERNAME)
