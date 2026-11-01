export class RegistryRequestError extends Error {
  readonly status?: number;
  readonly retryAfterMs: number;
  constructor(message: string, status?: number, retryAfterMs = 0) {
    super(message);
    this.name = 'RegistryRequestError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/** A bounded read, with explicit failures instead of fabricated empty result sets. */
export async function fetchRegistryJson(url: string, label: string, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const retry = response.headers.get('Retry-After');
      const retryAfterMs = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now())) : 0;
      throw new RegistryRequestError(response.status === 429
        ? `${label} rate limited this request (HTTP 429). Other selected sources remain available.`
        : `${label} returned HTTP ${response.status}.`, response.status, Number.isFinite(retryAfterMs) ? retryAfterMs : 0);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof RegistryRequestError) throw error;
    if (controller.signal.aborted) throw new RegistryRequestError(`${label} request timed out or was cancelled.`);
    throw new RegistryRequestError(`${label} could not be reached. Browser access rules, the network, or the provider may be blocking the request.`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
