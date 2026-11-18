import { setupAuth, runUserJourney } from '../lib/userJourney.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@ems.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123456';

// Step increments to identify degradation & breaking point
export const options = {
  scenarios: {
    capacity_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },   // Stage 1
        { duration: '30s', target: 50 },   // Stage 2
        { duration: '30s', target: 100 },  // Stage 3
        { duration: '30s', target: 200 },  // Stage 4
        { duration: '30s', target: 300 },  // Stage 5
        { duration: '30s', target: 500 },  // Stage 6
        { duration: '20s', target: 750 },  // Stage 7
        { duration: '20s', target: 1000 }, // Stage 8
        { duration: '20s', target: 0 },    // Cool-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // If error rate exceeds 15% or p95 > 1500ms, abort safely to protect server
    http_req_failed: [{ threshold: 'rate<0.15', abortOnFail: true, delayAbortEval: '15s' }],
    http_req_duration: [{ threshold: 'p(95)<1500', abortOnFail: true, delayAbortEval: '15s' }],
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
