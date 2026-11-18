#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const masterReportHtml = path.resolve(__dirname, 'reports', 'index.html');
const latestSummaryJson = path.resolve(__dirname, 'reports', 'latest', 'summary.json');
const historyJsonPath = path.resolve(__dirname, 'reports', 'history.json');

console.log('\n════════════════════════════════════════════════════════════════════════');
console.log(' 🚀 EMS ALL-IN-ONE PERFORMANCE DASHBOARD');
console.log('════════════════════════════════════════════════════════════════════════');

if (fs.existsSync(masterReportHtml)) {
  console.log(` 🌐 Open Dashboard: file:///${masterReportHtml.replace(/\\/g, '/')}`);

  let runCount = 0;
  if (fs.existsSync(historyJsonPath)) {
    try {
      const runs = JSON.parse(fs.readFileSync(historyJsonPath, 'utf-8'));
      runCount = runs.length;
    } catch {
      // ignore
    }
  }

  if (fs.existsSync(latestSummaryJson)) {
    try {
      const summary = JSON.parse(fs.readFileSync(latestSummaryJson, 'utf-8'));
      console.log('────────────────────────────────────────────────────────────────────────');
      console.log(`    Total Runs in History: ${runCount}`);
      console.log(`    Latest Run ID:         ${summary.testId}`);
      console.log(`    Scenario:              ${(summary.testName || '').toUpperCase()}`);
      console.log(`    Status:                ${summary.status}`);
      console.log(`    Throughput (RPS):      ${summary.requestsPerSecond} req/s`);
      console.log(`    P95 Latency:           ${summary.p95ResponseTimeMs} ms`);
      console.log(`    Error Rate:            ${summary.httpErrorRatePercent}%`);
      console.log(`    Redis Cache Hit Rate:  ${summary.redis ? summary.redis.hitRatePercent + '%' : 'N/A'}`);
    } catch {
      // ignore
    }
  }
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(' 👉 Tip: Double click "reports/index.html" in Chrome or Edge to view');
  console.log('    all historical runs, interactive charts, and comparisons in one place!\n');
} else {
  console.log('\n❌ No reports found yet. Run a test first via "npm run stress:smoke".\n');
}
