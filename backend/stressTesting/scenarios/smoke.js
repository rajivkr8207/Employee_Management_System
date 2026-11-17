import { setupAuth, runUserJourney } from '../lib/userJourney.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@ems.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123456';

export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      vus: 2,
      duration: __ENV.DURATION || '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.02'],
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
