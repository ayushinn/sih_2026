#!/usr/bin/env node
/**
 * THERMORA Smoke Test Script
 * Verifies connectivity between frontend dev environment and backend services.
 * Tests: GET /healthz, GET /readyz, GET /openapi.json
 */

const target = process.env.VITE_PROXY_TARGET || process.env.BACKEND_URL || 'http://localhost:8000';

const endpoints = [
  { path: '/healthz', name: 'Liveness Probe (/healthz)' },
  { path: '/readyz', name: 'Readiness Probe (/readyz)' },
  { path: '/openapi.json', name: 'OpenAPI Schema (/openapi.json)' },
];

console.log(`\n🔍 Running THERMORA Backend Smoke Test...`);
console.log(`📡 Target Backend: ${target}\n`);

let failedCount = 0;

async function checkEndpoint(item) {
  const url = `${target.replace(/\/$/, '')}${item.path}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const duration = Date.now() - start;

    if (res.ok) {
      console.log(`  [PASS] ${item.name} -> HTTP ${res.status} (${duration}ms)`);
      return true;
    } else {
      console.log(`  [FAIL] ${item.name} -> HTTP ${res.status} ${res.statusText} (${duration}ms)`);
      failedCount++;
      return false;
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`  [FAIL] ${item.name} -> Connection error: ${err.message} (${duration}ms)`);
    failedCount++;
    return false;
  }
}

async function run() {
  for (const ep of endpoints) {
    await checkEndpoint(ep);
  }

  console.log('\n--------------------------------------------------');
  if (failedCount === 0) {
    console.log(`✅ All smoke tests PASSED. Backend is reachable and healthy.\n`);
    process.exitCode = 0;
  } else {
    console.log(`⚠️  ${failedCount} check(s) FAILED. If running locally with VITE_USE_MOCK=true, this is expected until your FastAPI backend is started at ${target}.\n`);
    process.exitCode = 1;
  }
}

run();
