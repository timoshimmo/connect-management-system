/**
 * The access token lives only in memory (never localStorage) to keep it out
 * of reach of XSS-style DOM/storage scraping. The refresh token is a
 * separate httpOnly cookie the browser handles automatically, so losing the
 * in-memory token on a hard reload just means one silent `/auth/refresh`
 * round-trip before the app is usable again.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
