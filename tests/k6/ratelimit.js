import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const res = http.get(`${__ENV.TARGET}/api/kv-check`); // eslint-disable-line no-undef
  check(res, {
    '200 or 429': (r) => r.status === 200 || r.status === 429,
    'Rate limit headers present': (r) =>
      r.headers['RateLimit-Limit'] !== undefined,
    'Response time < 1s': (r) => r.timings.duration < 1000,
  });
  sleep(0.1);
}
