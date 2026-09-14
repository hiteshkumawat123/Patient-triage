/**
 * Happy-path smoke test for PatientTriage.ai.
 *
 * Drives a full high-acuity patient journey end-to-end (intake -> AI
 * extraction -> scoring -> confidence fusion -> confirm -> Operations
 * queue -> patient drawer -> Sentinel alert -> Capacity -> Analytics
 * -> command palette -> bulk simulation load -> theme toggle) and
 * fails loudly on any page or console error. Screenshots are written
 * to qa/screenshots/ for a quick visual check.
 *
 * Usage:
 *   npm install
 *   node test-happy-path.js
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

  const shot = async (name) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  };
  const checkpoint = (label) => {
    console.log(`--- ${label} ---`);
    console.log(errors.join('\n') || 'no errors');
  };

  await page.goto(APP_URL);
  await page.waitForTimeout(1000);
  checkpoint('after load');
  await shot('01-operations.png');

  // Switch to Triage, fill intake, run scoring on a high-acuity patient
  await page.click('[data-view="triage"]');
  await page.waitForTimeout(200);
  await page.fill('#p-name', 'Jordan Lee');
  await page.fill('#p-age', '46');
  await page.fill('#p-complaint', 'Sudden chest pain beginning about 20 minutes ago, rated 8 out of 10, with shortness of breath.');
  await page.fill('#v-hr', '118');
  await page.fill('#v-spo2', '88');
  await page.fill('#v-rr', '31');
  await page.fill('#v-sbp', '96');
  await page.fill('#v-temp', '37.2');
  await page.click('[data-action="extract-intake-ai"]');
  await page.waitForTimeout(200);
  await shot('02-intake.png');
  await page.click('[data-action="accept-extraction"]');
  await page.click('[data-action="run-scoring"]');
  await page.waitForTimeout(1500);
  checkpoint('after scoring');
  await shot('03-decision.png');

  await page.click('[data-action="set-nurse-certainty"][data-level="low"]');
  await page.waitForTimeout(200);
  await shot('04-fusion.png');

  await page.click('[data-action="confirm-assign-esi"]');
  await page.waitForTimeout(300);
  checkpoint('after confirm');

  // Operations view
  await page.click('[data-view="operations"]');
  await page.waitForTimeout(300);
  await shot('05-operations-queue.png');

  // Open patient drawer from the queue
  const row = await page.$('#queue-body tr');
  if (row) {
    await row.click();
    await page.waitForTimeout(300);
    await shot('06-patient-drawer.png');
  }
  await page.click('[data-action="close-patient-drawer"]');

  // Monitoring: trigger a simulated Sentinel deterioration alert
  await page.click('[data-view="monitoring"]');
  await page.waitForTimeout(300);
  await page.click('[data-action="simulate-sentinel-alert"]');
  await page.waitForTimeout(300);
  checkpoint('after sentinel alert');
  await shot('07-monitoring.png');

  // Capacity
  await page.click('[data-view="capacity"]');
  await page.waitForTimeout(300);
  await shot('08-capacity.png');

  // Analytics
  await page.click('[data-view="analytics"]');
  await page.waitForTimeout(300);
  await shot('09-analytics.png');

  // Command palette (Ctrl+K)
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await page.waitForTimeout(300);
  await shot('10-command-palette.png');
  await page.keyboard.press('Escape');

  // Simulation Console: bulk-load demo patients
  await page.click('[data-view="operations"]');
  await page.click('[data-target="modal-simulation"]');
  await page.waitForTimeout(200);
  await page.click('[data-count="18"]');
  await page.waitForTimeout(500);
  checkpoint('after simulation load');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await shot('11-queue-loaded.png');

  // Theme toggle
  await page.click('[data-action="toggle-theme"]');
  await page.waitForTimeout(300);
  await shot('12-theme-toggled.png');

  checkpoint('FINAL');
  await browser.close();

  if (errors.length) {
    console.error(`\nFAILED: ${errors.length} console/page error(s) captured. See log above.`);
    process.exit(1);
  }
  console.log('\nPASSED: happy-path smoke test completed with zero console/page errors.');
})();
