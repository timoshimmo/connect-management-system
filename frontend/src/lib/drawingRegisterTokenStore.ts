/**
 * Mirrors tokenStore.ts exactly, but as a fully separate in-memory variable —
 * the Drawing Register's access token must never be readable from or
 * confused with MS Publishing's (see drawingRegisterApiClient.ts).
 */
let drAccessToken: string | null = null;

export function getDrawingRegisterAccessToken(): string | null {
  return drAccessToken;
}

export function setDrawingRegisterAccessToken(token: string | null): void {
  drAccessToken = token;
}
