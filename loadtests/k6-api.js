import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

/**
 * BASE_URL — origin (e.g. http://localhost:8080 or https://kahoot-kroot.duckdns.org).
 * API_PREFIX — path nginx adds before Go (e.g. /api). Same idea as PUBLIC_API_PATH_PREFIX on the SPA.
 *
 * Example behind nginx:
 *   k6 run -e BASE_URL=https://kahoot-kroot.duckdns.org -e API_PREFIX=/api loadtests/k6-api.js
 */
function apiRoot() {
  const base = (__ENV.BASE_URL || "http://localhost:8080").replace(/\/$/, "");
  const prefix = (__ENV.API_PREFIX || "").trim();
  if (!prefix) return base;
  const p = prefix.startsWith("/") ? prefix : `/${prefix}`;
  return `${base}${p}`.replace(/\/$/, "");
}

const API = apiRoot();

const authLatency = new Trend("auth_latency", true);
const quizzesLatency = new Trend("quizzes_latency", true);

export const options = {
  scenarios: {
    warmup: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "20s", target: 10 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    constant_load: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 50),
      duration: __ENV.DURATION || "2m",
      startTime: "45s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    auth_latency: ["p(95)<600"],
    quizzes_latency: ["p(95)<400"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

function registerAndLogin() {
  const unique = `${__VU}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const login = `loadtest_${unique}`;
  const password = "loadtest_password_123";
  const username = `lt_user_${unique}`;

  const registerPayload = JSON.stringify({
    username,
    login,
    password,
  });

  const headers = { "Content-Type": "application/json" };

  // Registration may occasionally race on unique constraints under heavy load.
  http.post(`${API}/users/register`, registerPayload, { headers });

  const loginPayload = JSON.stringify({ login, password });
  const loginRes = http.post(`${API}/users/login`, loginPayload, { headers });
  authLatency.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    "login status is 200": (r) => r.status === 200,
    "login has token": (r) => {
      try {
        return !!r.json("token");
      } catch (_) {
        return false;
      }
    },
  });

  if (!loginOk) return null;

  return loginRes.json("token");
}

export default function () {
  const token = registerAndLogin();
  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const quizzesRes = http.get(`${API}/quizzes`, authHeaders);
  quizzesLatency.add(quizzesRes.timings.duration);
  check(quizzesRes, {
    "quizzes status is 200 or 404": (r) => r.status === 200 || r.status === 404,
  });

  // Invalid session id should return 400 and still reflect auth + routing health.
  const sessionExistsRes = http.get(`${API}/game-sessions/0/exists`, authHeaders);
  check(sessionExistsRes, {
    "exists endpoint responds": (r) => r.status >= 200 && r.status < 500,
  });

  sleep(1);
}
