export type CookiePreferences = { analytics: boolean; marketing: boolean };

export const necessaryOnly: CookiePreferences = { analytics: false, marketing: false };
export const allCookies: CookiePreferences = { analytics: true, marketing: true };
export const cookieStorageKey = "acme-demo-cookie-preferences";

export function readCookiePreferences(): CookiePreferences {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cookieStorageKey) ?? "null");
    if (typeof value === "object" && value !== null &&
      "version" in value && value.version === 1 &&
      "analytics" in value && typeof value.analytics === "boolean" &&
      "marketing" in value && typeof value.marketing === "boolean") {
      return { analytics: value.analytics, marketing: value.marketing };
    }
  } catch {
    // Storage may be unavailable or contain an older, invalid value.
  }
  return { ...necessaryOnly };
}

export function saveCookiePreferences(preferences: CookiePreferences): boolean {
  try {
    localStorage.setItem(cookieStorageKey, JSON.stringify({ version: 1, ...preferences }));
    return true;
  } catch {
    return false;
  }
}

export function cookieSummary(preferences: CookiePreferences): string {
  if (!preferences.analytics && !preferences.marketing) return "Only necessary cookies enabled";
  if (preferences.analytics && preferences.marketing) return "All cookie categories enabled";
  return preferences.analytics ? "Necessary and analytics cookies enabled" : "Necessary and marketing cookies enabled";
}
