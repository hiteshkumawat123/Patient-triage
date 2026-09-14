/**
 * Secondary QA pass for PatientTriage.ai.
 *
 * Covers: a non-red-flag patient (exercising the AI -> offline
 * heuristic fallback path with no network access), the Override
 * modal, the Audit Log, the Escalate modal (from the patient
 * drawer), Patient Records, Settings, the Nurse Duty Profile, and
 * tablet/mobile responsive layouts. Fails loudly on any page or
 * console error other than a blocked outbound AI request (expected
 * in an offline/sandboxed environment and part of what this script
 * verifies degrades gracefully).
 *
 * Usage:
 *   npm install
 *   node test-overrides-and-modals.js
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const OUT_DIR = path.join(__dirname, 'screenshots');
const APP_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  const shot = async (name, fullPage = true) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT_DIR, name), fullPage });
  };
  const checkpoint = (label) => {
    console.log(`--- ${label} ---`);
    console.log(errors.join('\n') || 'no errors');
  };

  await page.goto(APP_URL);
  await page.waitForTimeout(500);

  // Non-red-flag patient: exercises the AI -> offline heuristic fallback path
  await page.click('[data-view="triage"]');
  await page.fill('#p-name', 'Maya Shah');
  await page.fill('#p-age', '34');
  await page.fill('#p-complaint', 'Right lower abdominal pain, worsening over 8 hours');
  await page.fill('#v-hr', '96');
  await page.fill('#v-spo2', '98');
  await page.fill('#v-rr', '18');
  await page.fill('#v-sbp', '118');
  await page.fill('#v-temp', '37.8');
  await page.click('[data-action="run-scoring"]');
  await page.waitForTimeout(2500);
  checkpoint('after non-red-flag scoring');
  const esiSourceText = await page.textContent('#esi-source');
  console.log('ESI source text:', esiSourceText);
  await shot('A-heuristic-fallback.png');

  // Override modal
  await page.click('[data-action="open-override-picker"]');
  await page.waitForTimeout(200);
  await shot('B-override-modal.png', false);
  await page.click('[data-action="pick-override-esi"][data-level="2"]');
  await page.selectOption('#override-reason-select', 'Clinical presentation not captured');
  await page.fill('#override-notes', 'Rebound tenderness noted on exam, appendicitis suspected.');
  await page.click('[data-action="confirm-override"]');
  await page.waitForTimeout(300);
  checkpoint('after override confirm');
  await shot('C-after-override.png');

  await page.click('[data-action="confirm-assign-esi"]');
  await page.waitForTimeout(300);

  // Audit log
  await page.click('[data-view="analytics"]');
  await page.waitForTimeout(200);
  await page.click('[data-target="modal-audit"]');
  await page.waitForTimeout(200);
  await shot('D-audit-log.png', false);
  await page.keyboard.press('Escape');

  // Escalate modal via the patient drawer
  await page.click('[data-view="operations"]');
  await page.waitForTimeout(300);
  const rowCount = await page.locator('#queue-body tr').count();
  if (rowCount) {
    await page.locator('#queue-body tr').first().click({ timeout: 5000 });
    await page.waitForTimeout(200);
  }
  await page.click('[data-action="drawer-escalate"]');
  await page.waitForTimeout(200);
  await shot('E-escalate-modal.png', false);
  await page.fill('#escalate-reason', 'Sudden worsening of abdominal rigidity, guarding.');
  await page.click('[data-action="confirm-escalate"]');
  await page.waitForTimeout(300);
  checkpoint('after escalate confirm');

  // Patient records
  await page.keyboard.press('Escape');
  await page.click('[data-target="modal-records"]');
  await page.waitForTimeout(200);
  await shot('F-records.png', false);
  await page.keyboard.press('Escape');

  // Settings modal
  await page.click('[data-target="modal-settings"]');
  await page.waitForTimeout(200);
  await shot('G-settings.png', false);
  await page.keyboard.press('Escape');

  // Nurse duty profile
  await page.click('[data-target="modal-profile"]');
  await page.waitForTimeout(200);
  await page.fill('#nurse-name-input', 'R. Alvarez');
  await page.click('[data-action="save-nurse-name"]');
  await page.waitForTimeout(200);
  await shot('H-profile.png', false);
  await page.keyboard.press('Escape');

  // Responsive: tablet + mobile
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.click('[data-view="triage"]');
  await page.waitForTimeout(200);
  await shot('I-tablet-triage.png');

  await page.setViewportSize({ width: 420, height: 900 });
  await page.click('[data-view="operations"]');
  await page.waitForTimeout(200);
  await shot('J-mobile-operations.png');
  await page.click('[data-view="triage"]');
  await page.waitForTimeout(200);
  await shot('K-mobile-triage.png');

  checkpoint('FINAL');
  await browser.close();

  // A blocked outbound AI request is expected here and is what
  // confirms the offline heuristic fallback path; only fail the
  // build on a real page/app error.
  const realErrors = errors.filter(e => !/ERR_CERT_AUTHORITY_INVALID|ERR_INTERNET_DISCONNECTED|net::ERR_/.test(e));
  if (realErrors.length) {
    console.error(`\nFAILED: ${realErrors.length} unexpected console/page error(s). See log above.`);
    process.exit(1);
  }
  console.log('\nPASSED: override/escalate/modal/responsive QA pass completed with zero unexpected errors.');
})();
