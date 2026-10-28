export const REQUEST_ID_HEADER = 'x-request-id';

export const NO_REQUEST_ID = 'no-id';

/**
 * Reads the request ID propagated by the catch-all API dispatcher
 * (`src/app/api/[[...slug]]/route.ts`). Falls back to `NO_REQUEST_ID`
 * when called with a request that bypassed the dispatcher
 * (e.g. direct handler unit tests).
 */
export function getRequestId(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) ?? NO_REQUEST_ID;
}

/**
 * Handler-level log helper. Prefixes every line with the request ID so
 * all log lines of one API request can be filtered together in logs.
 */
export function apiLog(request: Request, message: string, ...args: unknown[]): void {
  console.log(`[api:${getRequestId(request)}] ${message}`, ...args);
}
