import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { platform, release } from 'node:os';
import { join } from 'node:path';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const RUNS = Number(process.env.RUNS || 100);
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);

if (!Number.isFinite(RUNS) || RUNS <= 0) {
  throw new Error(`RUNS must be a positive number. Received: ${process.env.RUNS}`);
}
if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
  throw new Error(`CONCURRENCY must be a positive number. Received: ${process.env.CONCURRENCY}`);
}

const SAMPLE_PREFIXES = ['0018A', '7C4A8', 'ABCDE', 'FFFFF', '12345'];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomHexPrefix = () => {
  const chars = '0123456789ABCDEF';
  let out = '';
  for (let i = 0; i < 5; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const percentile = (sorted, p) => {
  if (!sorted.length) return 0;
  const idx = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[idx];
};

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    median: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
  };
};

const runPool = async (items, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (true) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });

  await Promise.all(runners);
  return results;
};

const timedGet = async (url) => {
  const start = performance.now();
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  await response.text();
  const end = performance.now();

  return { ms: end - start, status: response.status };
};

const warmUp = async () => {
  const url = `${BASE_URL}/health`;
  for (let i = 0; i < 10; i += 1) {
    try {
      await timedGet(url);
    } catch (error) {
      // Ignore warmup errors so the script can still report failures in measured runs.
    }
  }
};

const measure = async (prefixes) => {
  const urls = prefixes.map((prefix) => `${BASE_URL}/pwned/range/${prefix}`);
  const results = await runPool(urls, timedGet);

  const durations = results.map((r) => r.ms);
  const statusCounts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return { results, durations, statusCounts };
};

const formatCounts = (counts) =>
  Object.entries(counts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');

const nowIso = new Date().toISOString();

console.log(`Latency test @ ${nowIso}`);
console.log(`BASE_URL=${BASE_URL} RUNS=${RUNS} CONCURRENCY=${CONCURRENCY}`);

await warmUp();

const coldPrefixes = [];
const seen = new Set();
while (coldPrefixes.length < RUNS) {
  const prefix = randomHexPrefix();
  if (seen.has(prefix)) continue;
  seen.add(prefix);
  coldPrefixes.push(prefix);
}

const warmPrefixes = Array.from({ length: RUNS }, () => randomChoice(SAMPLE_PREFIXES));

// Pre-warm the sample prefixes so the second pass is more likely to hit the API cache.
await measure(SAMPLE_PREFIXES);

const cold = await measure(coldPrefixes);
const warm = await measure(warmPrefixes);

const coldStats = stats(cold.durations);
const warmStats = stats(warm.durations);

const md = [];
md.push(`## ${nowIso}`);
md.push('');
md.push('**Environment**');
md.push(`- Node: ${process.version}`);
md.push(`- OS: ${platform()} ${release()}`);
md.push(`- BASE_URL: ${BASE_URL}`);
md.push(`- RUNS: ${RUNS}`);
md.push(`- CONCURRENCY: ${CONCURRENCY}`);
md.push('');
md.push('**Method**');
md.push('- Warmup: 10 requests to `/health` (not counted).');
md.push('- Cold pass: unique random prefixes (expected cache misses).');
md.push('- Warm pass: repeated sample prefixes after a pre-warm (expected cache hits).');
md.push('');
md.push('**Results (ms)**');
md.push(`- Cold: median ${coldStats.median.toFixed(1)}, p95 ${coldStats.p95.toFixed(1)}, min ${coldStats.min.toFixed(1)}, max ${coldStats.max.toFixed(1)}`);
md.push(`  - Status counts: ${formatCounts(cold.statusCounts) || 'none'}`);
md.push(`- Warm: median ${warmStats.median.toFixed(1)}, p95 ${warmStats.p95.toFixed(1)}, min ${warmStats.min.toFixed(1)}, max ${warmStats.max.toFixed(1)}`);
md.push(`  - Status counts: ${formatCounts(warm.statusCounts) || 'none'}`);
md.push('');

console.log('Cold (ms):', coldStats);
console.log('  Status:', cold.statusCounts);
console.log('Warm (ms):', warmStats);
console.log('  Status:', warm.statusCounts);

mkdirSync('docs', { recursive: true });
const resultsPath = join('docs', 'latency-results.md');

if (!(() => {
  try {
    readFileSync(resultsPath, 'utf8');
    return true;
  } catch {
    return false;
  }
})()) {
  writeFileSync(
    resultsPath,
    ['# Latency Results', '', 'Generated by `pnpm latency:test` (appends sections over time).', ''].join('\n'),
  );
}

appendFileSync(resultsPath, `${md.join('\n')}\n`);

