import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sha1Hex } from '@security-hash/shared';

import { parseHibpPayload } from './hibp';

test('sha1Hex produces an uppercase hex digest for known input', async () => {
  assert.equal(await sha1Hex('password'), '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
});

test('parseHibpPayload reads count from JSON payloads', async () => {
  const response = new Response(
    JSON.stringify({ results: [{ suffix: 'ABC123', count: 42 }, { suffix: 'ZZZ999', count: 5 }] }),
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  assert.equal(await parseHibpPayload(response, 'ABC123'), 42);
});

test('parseHibpPayload parses newline separated suffix data', async () => {
  const response = new Response('ABC123:10\nzzz999:3\nXYZ000:1', {
    headers: { 'content-type': 'text/plain' },
  });

  assert.equal(await parseHibpPayload(response, 'ZZZ999'), 3);
});

test('parseHibpPayload ignores malformed lines and missing suffixes', async () => {
  const response = new Response('bad-line\n\nABC123:NaN\nXYZ000:5', {
    headers: { 'content-type': 'text/plain' },
  });

  assert.equal(await parseHibpPayload(response.clone(), 'ABC123'), 0);
  assert.equal(await parseHibpPayload(response.clone(), 'XYZ000'), 5);
});
