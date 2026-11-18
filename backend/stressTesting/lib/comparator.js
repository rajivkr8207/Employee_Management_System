/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   HISTORICAL PERFORMANCE COMPARATOR
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Compares two test runs, computes delta percentages for RPS, Latency (P50/P95/P99),
 * Error rates, and classifies outcomes into:
 *  - "Performance improved"
 *  - "Performance degraded"
 *  - "No significant change"
 *
 * Handles zero-division edge cases safely.
 */

import fs from 'fs';
import path from 'path';

export class Comparator {
  constructor(reportsDir) {
    this.reportsDir = reportsDir || path.resolve(process.cwd(), 'stressTesting', 'reports');
    this.historyDir = path.join(this.reportsDir, 'history');
    this.comparisonsDir = path.join(this.reportsDir, 'comparisons');
    fs.mkdirSync(this.comparisonsDir, { recursive: true });
  }

  /**
   * Compare two test runs given either their summary objects or run IDs.
   */
  compare(baseRunOrId, currentRunOrId) {
    const baseSummary = typeof baseRunOrId === 'string' ? this.loadSummary(baseRunOrId) : baseRunOrId;
    const currentSummary = typeof currentRunOrId === 'string' ? this.loadSummary(currentRunOrId) : currentRunOrId;

    if (!baseSummary || !currentSummary) {
      throw new Error('[Comparator] One or both test summaries could not be loaded.');
    }

    // Compute deltas (Current vs Base)
    const rpsDelta = this.calcPercentDelta(baseSummary.requestsPerSecond, currentSummary.requestsPerSecond, true);
    const p95Delta = this.calcPercentDelta(baseSummary.p95ResponseTimeMs, currentSummary.p95ResponseTimeMs, false);
    const p99Delta = this.calcPercentDelta(baseSummary.p99ResponseTimeMs, currentSummary.p99ResponseTimeMs, false);
    const avgLatencyDelta = this.calcPercentDelta(baseSummary.avgResponseTimeMs, currentSummary.avgResponseTimeMs, false);
    const errorDelta = this.calcPercentDelta(baseSummary.httpErrorRatePercent, currentSummary.httpErrorRatePercent, false);

    // Classification
    // Improved: P95 improved by > 5% and RPS didn't drop by > 5% and error rate didn't increase
    let classification = 'No significant change';
    if (p95Delta.improved && rpsDelta.improved) {
      classification = 'Performance improved';
    } else if (p95Delta.degraded || rpsDelta.degraded || errorDelta.degraded) {
      classification = 'Performance degraded';
    } else if (p95Delta.improved || rpsDelta.improved) {
      classification = 'Performance improved';
    }

    const comparisonResult = {
      comparisonId: `compare-${baseSummary.testId}-vs-${currentSummary.testId}`,
      createdAt: new Date().toISOString(),
      classification,
      baseRun: {
        testId: baseSummary.testId,
        testName: baseSummary.testName,
        gitCommit: baseSummary.gitCommit,
        startTime: baseSummary.startTime,
        peakConcurrentUsers: baseSummary.peakConcurrentUsers,
        requestsPerSecond: baseSummary.requestsPerSecond,
        avgResponseTimeMs: baseSummary.avgResponseTimeMs,
        p95ResponseTimeMs: baseSummary.p95ResponseTimeMs,
        p99ResponseTimeMs: baseSummary.p99ResponseTimeMs,
        httpErrorRatePercent: baseSummary.httpErrorRatePercent,
      },
      currentRun: {
        testId: currentSummary.testId,
        testName: currentSummary.testName,
        gitCommit: currentSummary.gitCommit,
        startTime: currentSummary.startTime,
        peakConcurrentUsers: currentSummary.peakConcurrentUsers,
        requestsPerSecond: currentSummary.requestsPerSecond,
        avgResponseTimeMs: currentSummary.avgResponseTimeMs,
        p95ResponseTimeMs: currentSummary.p95ResponseTimeMs,
        p99ResponseTimeMs: currentSummary.p99ResponseTimeMs,
        httpErrorRatePercent: currentSummary.httpErrorRatePercent,
      },
      deltas: {
        requestsPerSecond: rpsDelta,
        p95ResponseTime: p95Delta,
        p99ResponseTime: p99Delta,
        avgResponseTime: avgLatencyDelta,
        httpErrorRate: errorDelta,
      },
    };

    // Save comparison report (JSON + HTML)
    const jsonPath = path.join(this.comparisonsDir, `${comparisonResult.comparisonId}.json`);
    const htmlPath = path.join(this.comparisonsDir, `${comparisonResult.comparisonId}.html`);

    fs.writeFileSync(jsonPath, JSON.stringify(comparisonResult, null, 2), 'utf-8');
    fs.writeFileSync(htmlPath, this.generateComparisonHtml(comparisonResult), 'utf-8');

    return { comparisonResult, jsonPath, htmlPath };
  }

  /**
   * Helper to compute percentage delta.
   * higherIsBetter = true for RPS / Throughput.
   * higherIsBetter = false for Latency / Error Rate.
   */
  calcPercentDelta(baseVal, currentVal, higherIsBetter) {
    if (baseVal === currentVal) {
      return { base: baseVal, current: currentVal, percentChange: 0, improved: false, degraded: false, text: '0%' };
    }

    if (baseVal === 0) {
      return {
        base: baseVal,
        current: currentVal,
        percentChange: currentVal > 0 ? 100 : 0,
        improved: higherIsBetter && currentVal > 0,
        degraded: !higherIsBetter && currentVal > 0,
        text: currentVal > 0 ? '+New' : '0%',
      };
    }

    const diff = currentVal - baseVal;
    const percent = Math.round((Math.abs(diff) / baseVal) * 1000) / 10;
    const isIncrease = diff > 0;

    let improved = false;
    let degraded = false;

    if (higherIsBetter) {
      improved = isIncrease && percent >= 3;
      degraded = !isIncrease && percent >= 3;
    } else {
      // For latency / error rate: lower is better!
      improved = !isIncrease && percent >= 3;
      degraded = isIncrease && percent >= 3;
    }

    const prefix = isIncrease ? '+' : '-';
    return {
      base: baseVal,
      current: currentVal,
      percentChange: percent,
      diff: Math.round(diff * 100) / 100,
      improved,
      degraded,
      text: `${prefix}${percent}%`,
    };
  }

  loadSummary(testId) {
    const summaryPath = path.join(this.historyDir, testId, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      return JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    }
    return null;
  }

  generateComparisonHtml(res) {
    const classColor =
      res.classification === 'Performance improved'
        ? '#10b981'
        : res.classification === 'Performance degraded'
          ? '#ef4444'
          : '#38bdf8';

    const renderDeltaRow = (label, delta, unit = '') => {
      const color = delta.improved ? '#10b981' : delta.degraded ? '#ef4444' : '#94a3b8';
      const arrow = delta.improved ? '▲' : delta.degraded ? '▼' : '▬';
      return `
        <tr>
          <td><strong>${label}</strong></td>
          <td>${delta.base} ${unit}</td>
          <td>${delta.current} ${unit}</td>
          <td style="color: ${color}; font-weight: 700;">${arrow} ${delta.text}</td>
        </tr>`;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Performance Comparison - ${res.comparisonId}</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 2rem; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h1, h2, h3 { color: #38bdf8; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; }
    .badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card" style="border-left: 6px solid ${classColor};">
      <h1>Performance Comparison Report</h1>
      <p style="color: #94a3b8;">Comparing <strong>${res.baseRun.testId}</strong> &rarr; <strong>${res.currentRun.testId}</strong></p>
      <div style="margin-top: 1rem;">
        <span class="badge" style="background: rgba(255,255,255,0.05); color: ${classColor}; border: 1px solid ${classColor};">
          ${res.classification.toUpperCase()}
        </span>
      </div>
    </div>

    <div class="card">
      <h2>Metric Deltas</h2>
      <table>
        <thead>
          <tr><th>Metric</th><th>Base (Before)</th><th>Current (After)</th><th>Delta</th></tr>
        </thead>
        <tbody>
          ${renderDeltaRow('Requests / Second (RPS)', res.deltas.requestsPerSecond, 'req/s')}
          ${renderDeltaRow('P95 Latency', res.deltas.p95ResponseTime, 'ms')}
          ${renderDeltaRow('P99 Latency', res.deltas.p99ResponseTime, 'ms')}
          ${renderDeltaRow('Average Latency', res.deltas.avgResponseTime, 'ms')}
          ${renderDeltaRow('HTTP Error Rate', res.deltas.httpErrorRate, '%')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Runs Evaluated</h2>
      <table>
        <thead>
          <tr><th>Parameter</th><th>Base Run</th><th>Current Run</th></tr>
        </thead>
        <tbody>
          <tr><td>Test Scenario</td><td>${res.baseRun.testName}</td><td>${res.currentRun.testName}</td></tr>
          <tr><td>Git Commit</td><td><code>${res.baseRun.gitCommit}</code></td><td><code>${res.currentRun.gitCommit}</code></td></tr>
          <tr><td>Executed At</td><td>${res.baseRun.startTime}</td><td>${res.currentRun.startTime}</td></tr>
          <tr><td>Peak VUs</td><td>${res.baseRun.peakConcurrentUsers} VUs</td><td>${res.currentRun.peakConcurrentUsers} VUs</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }
}
