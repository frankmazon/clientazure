/** Bounded retries for read-only admin requests, including response-body stalls. */
export async function adminGet(url: string, options: { signal?: AbortSignal; timeoutMs?: number; attempts?: number } = {}) {
  const { signal, timeoutMs = 12000, attempts = 3 } = options;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, timeoutMs);
    let retryable = true;
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      retryable = response.status >= 500 || response.status === 408 || response.status === 429;
      const result = await response.json();
      if (retryable) throw new Error('The server is temporarily unavailable.');
      return { response, result };
    } catch (error) {
      if (signal?.aborted) throw error;
      // Network failures and timeouts can recover; authentication/validation errors must not be retried.
      if (!retryable && !controller.signal.aborted) throw error;
      if (attempt === attempts - 1) throw new Error('Unable to load data. Please check your connection and click Refresh to try again.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  throw new Error('Unable to load data. Please click Refresh to try again.');
}
