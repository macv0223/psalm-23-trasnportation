/**
 * Psalm 23 Transportation - secure email-only quote notifications.
 * Cloudflare Worker, separate from the GitHub CMS login Worker.
 *
 * GET  /health    -> configuration readiness (no secrets disclosed)
 * POST /api/quote -> Turnstile verification, then Resend email to Yahoo
 *
 * No Twilio account, SMS gateway, or paid texting is required.
 */
const MAX_BODY_BYTES = 12000;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const DEFAULT_TO_EMAIL = 'Psalm23Transportation@yahoo.com';
const cleaned = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max + 1)
  : '';
const goodLength = (value, min, max) => value.length >= min && value.length <= max;

function json(data, status = 200, origin = '') {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin'
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
    headers.set('Access-Control-Max-Age', '3600');
  }
  return new Response(JSON.stringify(data), { status, headers });
}
function error(message, status, origin = '', extra = {}) {
  return json({ accepted: false, message, ...extra }, status, origin);
}
function approvedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowlist = String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim());
  return origin && allowlist.includes(origin) ? origin : '';
}
function ready(env) {
  return Boolean(
    env.RESEND_API_KEY && env.RESEND_FROM && env.TURNSTILE_SECRET_KEY &&
    EMAIL.test(String(env.QUOTE_TO_EMAIL || DEFAULT_TO_EMAIL)) &&
    String(env.ALLOWED_ORIGINS || '').trim()
  );
}

export function validateQuote(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const item = {
    customerName: cleaned(input.customerName, 120),
    customerEmail: cleaned(input.customerEmail, 180),
    customerPhone: cleaned(input.customerPhone, 25),
    pickup: cleaned(input.pickup, 180),
    destination: cleaned(input.destination, 180),
    load: cleaned(input.load, 2500),
    timeframe: cleaned(input.timeframe, 140),
    companyWebsite: cleaned(input.companyWebsite, 80),
    turnstileToken: typeof input.turnstileToken === 'string' ? input.turnstileToken : '',
    requestId: cleaned(input.requestId, 80)
  };
  const phoneDigits = item.customerPhone.replace(/\D/g, '');
  if (
    !goodLength(item.customerName, 2, 120) ||
    !goodLength(item.pickup, 2, 180) ||
    !goodLength(item.destination, 2, 180) ||
    !goodLength(item.load, 5, 2500) ||
    (item.customerEmail && !EMAIL.test(item.customerEmail)) ||
    (item.customerPhone && (phoneDigits.length < 7 || phoneDigits.length > 15)) ||
    (!item.customerEmail && !item.customerPhone) ||
    !/^[a-zA-Z0-9_-]{4,80}$/.test(item.requestId) ||
    !goodLength(item.turnstileToken, 8, 2048) ||
    item.timeframe.length > 140
  ) return null;
  return item;
}

function quoteEmail(item) {
  return [
    'NEW QUOTE REQUEST - PSALM 23 TRANSPORTATION', '',
    'Name: ' + item.customerName,
    'Customer phone: ' + (item.customerPhone || 'Not provided'),
    'Customer email: ' + (item.customerEmail || 'Not provided'),
    'Pickup: ' + item.pickup,
    'Destination: ' + item.destination,
    'Items: ' + item.load,
    'Preferred timeframe: ' + (item.timeframe || 'Not specified'),
    '', 'Reference: ' + item.requestId,
    'Submitted through psalm23transportation.com'
  ].join('\n');
}

async function verifyTurnstile(request, item, env, origin) {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: item.turnstileToken
  });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) return false;
  const check = await response.json();
  return check.success === true &&
    check.hostname === new URL(origin).hostname &&
    check.action === 'quote_request';
}

async function sendEmail(item, env) {
  const payload = {
    from: env.RESEND_FROM,
    to: [env.QUOTE_TO_EMAIL || DEFAULT_TO_EMAIL],
    subject: `Psalm 23 Transportation quote request - ${item.customerName}`,
    text: quoteEmail(item)
  };
  if (item.customerEmail) payload.reply_to = item.customerEmail;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `psalm23-quote-${item.requestId}`
    },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = approvedOrigin(request, env);
    if (path === '/health' && request.method === 'GET') {
      return json({ service: 'psalm23-quotes', channel: 'email', ready: ready(env) }, 200, origin);
    }
    if (path !== '/api/quote') return error('Not found.', 404, origin);
    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '3600',
        'Vary': 'Origin'
      }});
    }
    if (request.method !== 'POST') return error('Method not allowed.', 405, origin);
    if (!origin) return error('This website is not approved to submit requests.', 403);
    if (!ready(env)) return error('Online sending is temporarily unavailable. Please email or call us directly.', 503, origin);
    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > MAX_BODY_BYTES) return error('The request is too large.', 413, origin);
    if (!String(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
      return error('The request format is invalid.', 415, origin);
    }
    let raw;
    try { raw = await request.text(); }
    catch { return error('Unable to read the request.', 400, origin); }
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return error('The request is too large.', 413, origin);
    let data;
    try { data = JSON.parse(raw); }
    catch { return error('Unable to read the form data.', 400, origin); }
    const item = validateQuote(data);
    if (!item) return error('Please provide your name, a way to contact you, pickup and destination, and what needs moving.', 400, origin);
    // Hidden form field: quietly accept bot submissions without sending anything.
    if (item.companyWebsite) return json({ accepted: true, sent: { email: true }, message: 'Request received.' }, 200, origin);
    let verified = false;
    try { verified = await verifyTurnstile(request, item, env, origin); }
    catch { verified = false; }
    if (!verified) return error('Security check failed or expired. Please try the security check again.', 403, origin);
    let accepted = false;
    try { accepted = await sendEmail(item, env); }
    catch { accepted = false; }
    if (!accepted) return error('Email sending could not be confirmed. Please use Prepare email instead or call us.', 502, origin, { sent: { email: false } });
    return json({
      accepted: true,
      sent: { email: true },
      message: 'Your quote request was accepted by our email service.'
    }, 200, origin);
  }
};
