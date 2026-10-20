import test from 'node:test';
import assert from 'node:assert/strict';
import quotes, { validateQuote } from '../cms/quotes/worker.mjs';
import { readFileSync } from 'node:fs';
import { renderDocument, validateSite } from '../public/assets/render.js';

const host = 'https://psalm23transportation.com';
const uri = 'https://psalm23-quote-notifications.example.workers.dev/api/quote';
const validEnv = () => ({
  ALLOWED_ORIGINS: [host, 'https://www.psalm23transportation.com', 'https://macv0223.github.io'].join(','),
  RESEND_API_KEY: 'secret-resend-key',
  RESEND_FROM: 'Psalm 23 Transportation <quotes@psalm23transportation.com>',
  TURNSTILE_SECRET_KEY: 'secret-turnstile-key',
  QUOTE_TO_EMAIL: 'Psalm23Transportation@yahoo.com'
});
const fields = () => ({
  customerName: 'Alex Example',
  customerEmail: 'alex@example.net',
  customerPhone: '(713) 555-0199',
  pickup: 'Houston TX',
  destination: 'Dallas TX',
  load: 'A piece of equipment weighing about 800 pounds',
  timeframe: 'Next Monday',
  companyWebsite: '',
  turnstileToken: 'test-token-fully-completed',
  requestId: '27b2e2f7-01fa-4950-8f99-0c68213971e7'
});
const req = (p = fields(), origin = host) => new Request(uri, {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(p)
});
const asJson = async response => ({ status: response.status, body: await response.json() });
const withFetch = async (fake, callback) => {
  const original = globalThis.fetch;
  globalThis.fetch = fake;
  try { return await callback(); } finally { globalThis.fetch = original; }
};

test('site retains safe pending state and activates only with endpoint and public Turnstile key', () => {
  const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
  assert.equal(validateSite(site), true);
  site.settings.quoteApiEndpoint = '';
  site.settings.turnstileSiteKey = '';
  let html = renderDocument(site);
  assert.match(html, /name="customerEmail"/);
  assert.match(html, /name="customerPhone"/);
  assert.match(html, /disabled aria-disabled="true"/);
  assert.doesNotMatch(html, /data-endpoint="https:/);
  site.settings.quoteApiEndpoint = uri;
  site.settings.turnstileSiteKey = '0x123456789abcdef000001';
  html = renderDocument(site);
  assert.match(html, /data-enabled="true"/);
  assert.match(html, /data-action="quote_request"/);
  assert.match(html, /https:\/\/challenges.cloudflare.com\/turnstile\/v0\/api.js/);
  assert.doesNotMatch(html, /disabled aria-disabled="true"/);
  site.settings.quoteApiEndpoint = 'javascript:alert(1)';
  assert.throws(() => validateSite(site), /Quote endpoint/);
});

test('validates customer contact and mandatory quote fields', () => {
  assert.ok(validateQuote(fields()));
  for (const key of ['customerName', 'pickup', 'destination', 'load']) {
    const x = fields(); x[key] = ''; assert.equal(validateQuote(x), null, key);
  }
  const missing = fields(); missing.customerEmail = ''; missing.customerPhone = '';
  assert.equal(validateQuote(missing), null);
  const byPhone = fields(); byPhone.customerEmail = ''; assert.ok(validateQuote(byPhone));
  const byEmail = fields(); byEmail.customerPhone = ''; assert.ok(validateQuote(byEmail));
  const invalid = fields(); invalid.customerEmail = 'not-a-mailbox'; assert.equal(validateQuote(invalid), null);
  const huge = fields(); huge.load = 'x'.repeat(2600); assert.equal(validateQuote(huge), null);
  const tooLong = fields(); tooLong.turnstileToken = 'x'.repeat(2049); assert.equal(validateQuote(tooLong), null);
});

test('health is ready with Resend and Turnstile only, without Twilio', async () => {
  let r = await asJson(await quotes.fetch(new Request('https://worker.test/health'), validEnv()));
  assert.deepEqual(r, { status: 200, body: { service: 'psalm23-quotes', channel: 'email', ready: true } });
  for (const key of ['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'RESEND_FROM', 'ALLOWED_ORIGINS']) {
    const env = validEnv(); delete env[key];
    r = await asJson(await quotes.fetch(new Request('https://worker.test/health'), env));
    assert.equal(r.body.ready, false, key);
  }
});

test('approved origin: Turnstile verification, then Resend email (not Twilio)', async () => {
  const calls = [];
  await withFetch(async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('siteverify')) return Response.json({ success: true, hostname: 'psalm23transportation.com', action: 'quote_request' });
    if (String(url).includes('resend.com')) return Response.json({ id: 'email-accepted' });
    throw new Error('Unexpected provider');
  }, async () => {
    const response = await asJson(await quotes.fetch(req(), validEnv()));
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.sent, { email: true });
    assert.equal(response.body.accepted, true);
    assert.match(response.body.message, /email service/i);
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body.get('secret'), 'secret-turnstile-key');
  assert.equal(calls[0].options.body.get('response'), fields().turnstileToken);
  const email = JSON.parse(calls[1].options.body);
  assert.deepEqual(email.to, ['Psalm23Transportation@yahoo.com']);
  assert.equal(email.reply_to, 'alex@example.net');
  assert.match(email.text, /Alex Example/);
  assert.match(email.text, /Houston TX/);
  assert.match(email.text, /Dallas TX/);
  assert.match(email.text, /800 pounds/);
  assert.match(calls[1].options.headers['Idempotency-Key'], /psalm23-quote-/);
});

test('bad origin is rejected before external requests', async () => {
  await withFetch(async () => { throw new Error('No provider should run'); }, async () => {
    const r = await asJson(await quotes.fetch(req(fields(), 'https://malicious.example'), validEnv()));
    assert.equal(r.status, 403);
    assert.equal(r.body.accepted, false);
  });
});

test('missing Resend config blocks sending without claiming success', async () => {
  const env = validEnv(); delete env.RESEND_API_KEY;
  await withFetch(async () => { throw new Error('No provider should run'); }, async () => {
    const r = await asJson(await quotes.fetch(req(), env));
    assert.equal(r.status, 503);
    assert.equal(r.body.accepted, false);
  });
});

test('Turnstile invalid hostname or action rejects requests', async () => {
  for (const override of [{ hostname: 'other.example' }, { action: 'wrong_action' }, { success: false }]) {
    let called = 0;
    await withFetch(async () => {
      called++;
      return Response.json({ success: true, hostname: 'psalm23transportation.com', action: 'quote_request', ...override });
    }, async () => {
      const r = await asJson(await quotes.fetch(req(), validEnv()));
      assert.equal(r.status, 403);
    });
    assert.equal(called, 1);
  }
});

test('Resend refusal is a 502 error, not a claim that it was sent', async () => {
  await withFetch(async url => {
    if (String(url).includes('siteverify')) return Response.json({ success: true, hostname: 'psalm23transportation.com', action: 'quote_request' });
    return Response.json({ error: 'sending unavailable' }, { status: 503 });
  }, async () => {
    const r = await asJson(await quotes.fetch(req(), validEnv()));
    assert.equal(r.status, 502);
    assert.deepEqual(r.body.sent, { email: false });
    assert.equal(r.body.accepted, false);
  });
});

test('no outgoing requests for honeypot submissions', async () => {
  await withFetch(async () => { throw new Error('Should not call providers'); }, async () => {
    const input = fields(); input.companyWebsite = 'spam.example';
    const response = await asJson(await quotes.fetch(req(input), validEnv()));
    assert.equal(response.status, 200);
  });
});

test('CORS OPTIONS works for approved origins only', async () => {
  let request = new Request(uri, { method: 'OPTIONS', headers: { Origin: host } });
  let response = await quotes.fetch(request, validEnv());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), host);
  request = new Request(uri, { method: 'OPTIONS', headers: { Origin: 'https://other.example' } });
  response = await quotes.fetch(request, validEnv());
  assert.equal(response.status, 403);
});

test('input and content type validation happen before provider calls', async () => {
  await withFetch(async () => { throw new Error('No provider should run'); }, async () => {
    const input = fields(); input.customerName = '';
    let r = await asJson(await quotes.fetch(req(input), validEnv()));
    assert.equal(r.status, 400);
    const invalid = new Request(uri, { method: 'POST', headers: { Origin: host, 'Content-Type': 'text/plain' }, body: 'anything' });
    r = await asJson(await quotes.fetch(invalid, validEnv()));
    assert.equal(r.status, 415);
  });
});
