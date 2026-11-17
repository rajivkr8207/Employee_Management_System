#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   STANDALONE HISTORICAL REPORT COMPARISON CLI
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node stressTesting/compare.js                        (Compares 2 most recent runs)
 *   node stressTesting/compare.js <testId1> <testId2>   (Compares specific runs)
 */

import fs from 'fs';
import path from 'path';
import { Comparator } from './lib/comparator.js';

const reportsDir = path.resolve(process.cwd(), 'stressTesting', 'reports');
const historyDir = path.join(reportsDir, 'history');

const args = process.argv.slice(2);
let runA = args[0];
let runB = args[1];

if (!runA || !runB) {
  // Find latest two runs
  if (!fs.existsSync(historyDir)) {
    console.error('❌ No historical reports found. Please run a stress test first via "npm run stress:smoke".');
    process.exit(1);
  }

  const runs = fs.readdirSync(historyDir)
    .filter((name) => fs.statSync(path.join(historyDir, name)).isDirectory())
    .sort()
    .reverse();

  if (runs.length < 2) {
    console.error(`❌ Found ${runs.length} historical run(s). At least 2 runs are required to perform a comparison.`);
    process.exit(1);
  }

  runA = runs[1]; // Older (base)
  runB = runs[0]; // Newer (current)
}

console.log(`\n🔍 Comparing Test Runs:`);
console.log(`   Base (Before):    ${runA}`);
console.log(`   Current (After):  ${runB}\n`);

try {
  const comparator = new Comparator(reportsDir);
  const { comparisonResult, jsonPath, htmlPath } = comparator.compare(runA, runB);

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(` 📊 PERFORMANCE COMPARISON RESULTS`);
  console.log(`    Status:         ${comparisonResult.classification.toUpperCase()}`);
  console.log(`    Throughput RPS: ${comparisonResult.deltas.requestsPerSecond.text}`);
  console.log(`    P95 Latency:    ${comparisonResult.deltas.p95ResponseTime.text}`);
  console.log(`    P99 Latency:    ${comparisonResult.deltas.p99ResponseTime.text}`);
  console.log(`    Avg Latency:    ${comparisonResult.deltas.avgResponseTime.text}`);
  console.log(`    Error Rate:     ${comparisonResult.deltas.httpErrorRate.text}`);
  console.log('────────────────────────────────────────────────────────────────────────');
  console.log(` 📁 Saved Comparison JSON: ${jsonPath}`);
  console.log(` 🌐 View Comparison HTML: file:///${htmlPath.replace(/\\/g, '/')}`);
  console.log('════════════════════════════════════════════════════════════════════════\n');
} catch (err) {
  console.error(`❌ Comparison failed: ${err.message}`);
  process.exit(1);
}
