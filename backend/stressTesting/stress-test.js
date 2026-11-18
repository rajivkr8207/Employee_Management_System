/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   UNIFIED K6 STRESS TESTING ENTRYPOINT
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This entrypoint is invoked by the Node.js runner or directly via k6 CLI:
 *   k6 run stressTesting/stress-test.js
 *   k6 run -e SCENARIO=load stressTesting/stress-test.js
 */

import { setupAuth, runUserJourney } from './lib/userJourney.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@ems.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123456';
const SCENARIO = __ENV.SCENARIO || 'smoke';

// Select scenario profile dynamically
const scenarioProfiles = {
  smoke: {
    executor: 'constant-vus',
    vus: 2,
    duration: __ENV.DURATION || '15s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '20s', target: 20 },
      { duration: '30s', target: 50 },
      { duration: '40s', target: 100 },
      { duration: '20s', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '20s', target: 50 },
      { duration: '30s', target: 100 },
      { duration: '40s', target: 200 },
      { duration: '30s', target: 300 },
      { duration: '20s', target: 500 },
      { duration: '20s', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 10 },
      { duration: '15s', target: 300 },
      { duration: '20s', target: 300 },
      { duration: '15s', target: 10 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 30,
    duration: __ENV.SOAK_DURATION || '10m',
  },
  capacity: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '15s', target: 25 },
      { duration: '20s', target: 50 },
      { duration: '25s', target: 100 },
      { duration: '25s', target: 200 },
      { duration: '25s', target: 300 },
      { duration: '20s', target: 500 },
      { duration: '15s', target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: scenarioProfiles[SCENARIO] || scenarioProfiles.smoke,
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    http_req_failed: ['rate<0.10'],
  },
};

export function setup() {
  return setupAuth(BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export default function (data) {
  runUserJourney(data);
}

export function handleSummary(data) {
  const summaryPath = __ENV.SUMMARY_PATH || 'summary.json';
  return {
    [summaryPath]: JSON.stringify(data),
  };
}
