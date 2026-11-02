import type { IncomingMessage, ServerResponse } from 'node:http';
import { APPLICANT_TYPES, normalizeEuSearch, normalizeGrantsDetail, normalizeGrantsSearch, normalizeUkriFeed, type ApplicantType } from '../src/services/fundingService.ts';

const cache = new Map<string, { expires: number; value: unknown }>();
let activeRequests = 0;
const MAX_BODY = 12000;
const reply = (res: ServerResponse, code: number, body: unknown) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(body)); };
async function readBody(req: IncomingMessage): Promise<any> {
  let body = '';
  for await (const chunk of req) { body += chunk.toString(); if (body.length > MAX_BODY) throw new Error('Request is too large.'); }
  return JSON.parse(body);
}
async function upstream(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000), redirect: 'error', headers: { Accept: 'application/json, application/rss+xml, application/xml', ...init?.headers } });
  if (!response.ok) throw new Error(`The official funding source returned HTTP ${response.status}${response.status === 429 ? ' (rate limited; retry later)' : ''}.`);
  return response;
}
async function boundedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The funding source returned an empty body.');
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > 8 * 1024 * 1024) throw new Error('Funding response exceeded the size limit.'); chunks.push(next.value); } }
  finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let position = 0; for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.length; }
  return new TextDecoder().decode(bytes);
}
async function json(response: Response): Promise<any> { try { return JSON.parse(await boundedText(response)); } catch { throw new Error('The funding source did not return usable JSON.'); } }

/** Fixed official hosts only. No arbitrary URL forwarding, credentials, or application submission. */
export async function fundingMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> {
  const path = (req.url || '').split('?')[0];
  if (!path.startsWith('/api/funding/')) { next(); return; }
  if (!['/api/funding/search', '/api/funding/detail'].includes(path)) { reply(res, 404, { error: 'Unknown funding route.' }); return; }
  if (req.method !== 'POST') { reply(res, 405, { error: 'Use POST for funding searches.' }); return; }
  if (!(req.headers['content-type'] || '').includes('application/json')) { reply(res, 415, { error: 'Use a JSON request.' }); return; }
  if (req.headers.origin) { try { if (new URL(req.headers.origin).host !== req.headers.host) { reply(res, 403, { error: 'Use the funding connector from this application.' }); return; } } catch { reply(res, 403, { error: 'Invalid request origin.' }); return; } }
  let body: any;
  try { body = await readBody(req); } catch { reply(res, 400, { error: 'Provide a valid, bounded JSON request.' }); return; }
  if (!body || typeof body !== 'object' || !['grants', 'eu', 'ukri'].includes(body.source)) { reply(res, 400, { error: 'Choose a supported funding source.' }); return; }
  if (path.endsWith('/detail') && (body.source !== 'grants' || !/^\d{1,12}$/.test(String(body.id)))) { reply(res, 400, { error: 'Choose a Grants.gov opportunity ID.' }); return; }
  if (path.endsWith('/search') && (typeof body.query !== 'string' || body.query.trim().length < 2 || body.query.length > 300 || !Object.hasOwn(APPLICANT_TYPES, body.applicant) || !['current', 'open', 'forecasted', 'all'].includes(body.status) || !Number.isInteger(body.offset) || body.offset < 0 || body.offset > 1000)) { reply(res, 400, { error: 'Check query, applicant, status, and pagination values.' }); return; }
  const key = JSON.stringify([path, body.source, body.id, body.query, body.applicant, body.status, body.offset]);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) { reply(res, 200, cached.value); return; }
  if (activeRequests >= 8) { reply(res, 429, { error: 'Funding searches are busy. Wait for current requests to finish.' }); return; }
  activeRequests++;
  try {
    const at = new Date().toISOString(); let value: unknown;
    if (path.endsWith('/detail')) {
      value = normalizeGrantsDetail(await json(await upstream('https://api.grants.gov/v1/api/fetchOpportunity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: Number(body.id) }) })), at);
    } else if (body.source === 'grants') {
      const codes = APPLICANT_TYPES[body.applicant as ApplicantType].codes;
      value = normalizeGrantsSearch(await json(await upstream('https://api.grants.gov/v1/api/search2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: body.query.trim(), rows: 20, startRecordNum: body.offset, oppStatuses: body.status === 'all' ? 'posted|forecasted|closed|archived' : body.status === 'open' ? 'posted' : body.status === 'forecasted' ? 'forecasted' : 'posted|forecasted', eligibilities: codes.length ? [...codes, '99', '25'].join('|') : '', fundingInstruments: 'G|CA' }) })), body.offset, at);
    } else if (body.source === 'eu') {
      const statuses = body.status === 'all' ? ['31094501', '31094502', '31094503'] : body.status === 'open' ? ['31094502'] : body.status === 'forecasted' ? ['31094501'] : ['31094501', '31094502'];
      const form = new FormData();
      form.append('query', new Blob([JSON.stringify({ bool: { must: [{ terms: { type: ['1'] } }, { terms: { status: statuses } }] } })], { type: 'application/json' }));
      form.append('languages', new Blob(['["en"]'], { type: 'application/json' }));
      const params = new URLSearchParams({ apiKey: 'SEDIA', text: body.query.trim(), pageSize: '20', pageNumber: String(Math.floor(body.offset / 20) + 1) });
      value = normalizeEuSearch(await json(await upstream(`https://api.tech.ec.europa.eu/search-api/prod/rest/search?${params}`, { method: 'POST', body: form })), body.offset, at);
    } else {
      value = normalizeUkriFeed(await boundedText(await upstream('https://www.ukri.org/opportunity/feed/')), body.query, at);
    }
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 5 * 60 * 1000, value });
    reply(res, 200, value);
  } catch (failure) { reply(res, 502, { error: failure instanceof Error && failure.name === 'TimeoutError' ? 'The funding source timed out. Other sources remain usable.' : failure instanceof Error ? failure.message : 'The funding source is unavailable.' }); }
  finally { activeRequests--; }
}
