#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   STRESS TESTING ORCHESTRATOR & AUTOMATED RUNNER
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Coordinates execution of k6 test scenarios, system resource monitoring,
 * historical artifact generation, and automatic comparison against previous runs.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { CONFIG, assertSafeTarget } from './lib/config.js';
import { SystemMonitor } from './lib/systemMonitor.js';
import { Reporter } from './lib/reporter.js';
import { Comparator } from './lib/comparator.js';

// ─── CLI ARGUMENTS PARSING ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const scenario = args[0] || process.env.SCENARIO || 'smoke';
const targetUrl = process.env.BASE_URL || CONFIG.BASE_URL;

// Generate Unique Test ID: stress-<scenario>-YYYY-MM-DD-HHmmss
const now = new Date();
const timestampStr = now.toISOString().replace(/T/, '-').replace(/:/g, '').split('.')[0];
const testId = `stress-${scenario}-${timestampStr}`;

// ─── GIT & APPLICATION METADATA ──────────────────────────────────────────────
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // ignore
}

let appVersion = '1.0.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
  appVersion = pkg.version || '1.0.0';
} catch {
  // ignore
}

// ─── MAIN EXECUTION FUNCTION ─────────────────────────────────────────────────
async function run() {
  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(` 🚀 STARTING STRESS TEST RUN: [${testId}]`);
  console.log(` 🎯 Scenario:   ${scenario.toUpperCase()}`);
  console.log(` 🌐 Target URL: ${targetUrl}`);
  console.log(` 🔖 Git Commit: ${gitCommit} (v${appVersion})`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // 1. Safety check target
  assertSafeTarget(targetUrl);

  // 2. Healthcheck ping
  console.log(`🔍 Verifying server availability at ${targetUrl}/health ...`);
  const isServerUp = await pingServer(`${targetUrl}/health`);
  if (!isServerUp) {
    console.error(`\n❌ [ERROR] Target server is OFFLINE at ${targetUrl}/health.`);
    console.error('👉 Please start the backend server first via "npm run dev" or "npm start" before running stress tests.\n');
    process.exit(1);
  }
  console.log('✅ Server is online and responsive.\n');

  // 3. Prepare temporary output location for k6 summary
  const tempSummaryPath = path.resolve(process.cwd(), `temp-summary-${Date.now()}.json`);

  // 4. Initialize & start system monitoring in background
  const monitor = new SystemMonitor();
  await monitor.init();
  monitor.start(1000);
  console.log('📊 System resource & Redis monitoring started.');

  // 5. Check if InfluxDB is reachable for live Docker metrics
  const isInfluxUp = await pingServer('http://localhost:8086/ping');
  const influxArgs = isInfluxUp ? ['--out', 'influxdb=http://localhost:8086/k6'] : [];
  if (isInfluxUp) {
    console.log('📈 Live InfluxDB monitoring detected. Streaming real-time metrics to Grafana.');
  }

  // 6. Select k6 script path
  const scenarioFilePath = path.resolve(process.cwd(), 'stressTesting', 'scenarios', `${scenario}.js`);
  const scriptToRun = fs.existsSync(scenarioFilePath)
    ? scenarioFilePath
    : path.resolve(process.cwd(), 'stressTesting', 'stress-test.js');

  const k6Args = [
    'run',
    scriptToRun,
    '-e', `BASE_URL=${targetUrl}`,
    '-e', `SCENARIO=${scenario}`,
    '-e', `SUMMARY_PATH=${tempSummaryPath}`,
    ...influxArgs,
  ];

  const startTime = new Date().toISOString();
  const startTs = Date.now();

  console.log(`⚡ Spawning k6 test execution...\n`);

  // 7. Execute k6
  const k6ExitCode = await new Promise((resolve) => {
    const k6Process = spawn('k6', k6Args, {
      stdio: 'inherit',
      shell: true,
    });

    k6Process.on('close', (code) => resolve(code));
    k6Process.on('error', (err) => {
      console.error(`[k6 Spawn Error]: ${err.message}`);
      resolve(1);
    });
  });

  const endTime = new Date().toISOString();
  const durationSeconds = Math.round((Date.now() - startTs) / 1000);

  // 8. Stop system monitoring
  console.log('\n🛑 Stopping system resource monitoring and computing averages...');
  const systemMetrics = await monitor.stop();

  // 9. Read k6 output summary
  let k6Summary = null;
  if (fs.existsSync(tempSummaryPath)) {
    try {
      k6Summary = JSON.parse(fs.readFileSync(tempSummaryPath, 'utf-8'));
      fs.unlinkSync(tempSummaryPath);
    } catch (err) {
      console.warn(`[Warning] Could not parse k6 summary JSON: ${err.message}`);
    }
  }

  if (!k6Summary) {
    console.error('\n❌ [ERROR] k6 execution failed to output summary data.');
    process.exit(k6ExitCode || 1);
  }

  // 10. Capacity / Breaking Point detection (if scenario === 'capacity' or 'stress')
  let capacityResult = null;
  if (scenario === 'capacity' || scenario === 'stress') {
    capacityResult = evaluateCapacity(k6Summary, systemMetrics);
  }

  // 11. Save artifacts & generate reports
  const reporter = new Reporter();
  const metadata = {
    testId,
    scenario,
    startTime,
    endTime,
    durationSeconds,
    gitCommit,
    appVersion,
    targetUrl,
    environment: process.env.NODE_ENV || 'development',
    k6ExitCode,
  };

  const { runDir, summaryData, reportHtmlPath } = await reporter.saveRun({
    metadata,
    k6Summary,
    systemMetrics,
    capacityResult,
  });

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(` 📁 HISTORICAL ARTIFACTS PERSISTED PERMANENTLY:`);
  console.log(`    Location: ${runDir}`);
  console.log(`    📄 1. summary.json`);
  console.log(`    📄 2. metrics.json`);
  console.log(`    📄 3. system-metrics.json`);
  console.log(`    📄 4. metadata.json`);
  console.log(`    🌐 5. report.html -> file:///${reportHtmlPath.replace(/\\/g, '/')}`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // 12. Run automatic performance comparison against previous run
  const previousRun = reporter.getPreviousRun(testId);
  if (previousRun) {
    try {
      const comparator = new Comparator();
      const { comparisonResult, htmlPath } = comparator.compare(previousRun, summaryData);
      console.log('════════════════════════════════════════════════════════════════════════');
      console.log(` 📊 PERFORMANCE COMPARISON AGAINST PREVIOUS RUN:`);
      console.log(`    Comparing: [${previousRun.testId}] -> [${testId}]`);
      console.log(`    Outcome:   ${comparisonResult.classification.toUpperCase()}`);
      console.log(`    RPS Delta:      ${comparisonResult.deltas.requestsPerSecond.text}`);
      console.log(`    P95 Latency:    ${comparisonResult.deltas.p95ResponseTime.text}`);
      console.log(`    P99 Latency:    ${comparisonResult.deltas.p99ResponseTime.text}`);
      console.log(`    HTML Diff: file:///${htmlPath.replace(/\\/g, '/')}`);
      console.log('════════════════════════════════════════════════════════════════════════\n');
    } catch (err) {
      console.warn(`[Comparator] Could not run automatic comparison: ${err.message}`);
    }
  }

  // Exit with k6 status code
  if (k6ExitCode !== 0) {
    console.error(`⚠️ Test finished with non-zero exit code (${k6ExitCode}) due to breached thresholds.`);
    process.exit(k6ExitCode);
  } else {
    console.log(`✅ Test [${testId}] completed successfully with all thresholds satisfied!\n`);
  }
}

/**
 * Safe HTTP ping helper
 */
function pingServer(urlStr) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 80,
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 2500,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        },
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Capacity & Breaking Point Detection Helper
 */
function evaluateCapacity(k6Summary, systemMetrics) {
  const reqFailedRate = k6Summary?.metrics?.http_req_failed?.values?.rate || 0;
  const p95Latency = k6Summary?.metrics?.http_req_duration?.values?.['p(95)'] || 0;
  const p99Latency = k6Summary?.metrics?.http_req_duration?.values?.['p(99)'] || 0;
  const vusMax = k6Summary?.metrics?.vus_max?.values?.max || k6Summary?.metrics?.vus?.values?.max || 0;

  const isDegraded = reqFailedRate > 0.01 || p95Latency > 300 || p99Latency > 1000;
  const isBroken = reqFailedRate > 0.10 || p95Latency > 1500;

  let maxSustainableUsers = vusMax;
  let firstDegradationPoint = null;
  let breakingPoint = null;

  if (isBroken) {
    breakingPoint = `${vusMax} VUs`;
    maxSustainableUsers = Math.max(1, Math.round(vusMax * 0.6));
    firstDegradationPoint = `${Math.round(vusMax * 0.5)} VUs`;
  } else if (isDegraded) {
    firstDegradationPoint = `${vusMax} VUs`;
    maxSustainableUsers = Math.max(1, Math.round(vusMax * 0.8));
  }

  return {
    maxTestedUsers: vusMax,
    maxSustainableUsers,
    firstDegradationPoint,
    breakingPoint,
    p95LatencyMs: Math.round(p95Latency * 100) / 100,
    errorRatePercent: Math.round(reqFailedRate * 10000) / 100,
    cpuSaturationObserved: (systemMetrics.cpu?.peakPercent || 0) > 90,
    memoryExhaustionObserved: (systemMetrics.ram?.peakPercent || 0) > 95,
  };
}

run().catch((err) => {
  console.error(`[FATAL ERROR]: ${err.message}`);
  process.exit(1);
});
