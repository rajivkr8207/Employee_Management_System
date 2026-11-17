import { setupAuth, runUserJourney } from '../lib/userJourney.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@ems.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123456';

export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },  // Normal baseline
        { duration: '15s', target: 400 }, // Sudden surge
        { duration: '30s', target: 400 }, // Sustained spike
        { duration: '15s', target: 10 },  // Rapid scale down
        { duration: '20s', target: 10 },  // Recovery observation
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
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
