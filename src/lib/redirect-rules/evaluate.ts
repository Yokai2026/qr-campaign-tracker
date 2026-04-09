/**
 * Evaluates conditional redirect rules against the current request context.
 * Returns the target URL of the first matching rule (highest priority first),
 * or null if no rule matches.
 */

import type { RedirectRule } from '@/types';

interface EvalContext {
  deviceType: string;   // 'mobile' | 'tablet' | 'desktop' | 'unknown'
  osFamily: string;     // 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | ...
  browserFamily: string; // 'Chrome' | 'Safari' | 'Firefox' | ...
  country: string | null;
}

/**
 * Evaluate rules sorted by priority DESC. Return the first matching target_url.
 */
export function evaluateRules(
  rules: RedirectRule[],
  ctx: EvalContext,
): string | null {
  // Sort by priority descending (highest first)
  const sorted = [...rules]
    .filter((r) => r.active)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (matchesCondition(rule, ctx)) {
      return rule.target_url;
    }
  }

  return null;
}

function matchesCondition(rule: RedirectRule, ctx: EvalContext): boolean {
  const val = rule.condition_value;

  switch (rule.condition_type) {
    case 'device': {
      // { "devices": ["mobile", "tablet"] }
      const devices = val.devices as string[] | undefined;
      if (!devices || !Array.isArray(devices)) return false;
      return devices.some((d) => d.toLowerCase() === ctx.deviceType.toLowerCase());
    }

    case 'os': {
      // { "os": ["iOS", "Android"] }
      const osList = val.os as string[] | undefined;
      if (!osList || !Array.isArray(osList)) return false;
      return osList.some((o) => o.toLowerCase() === ctx.osFamily.toLowerCase());
    }

    case 'browser': {
      // { "browsers": ["Chrome", "Safari"] }
      const browsers = val.browsers as string[] | undefined;
      if (!browsers || !Array.isArray(browsers)) return false;
      return browsers.some((b) => b.toLowerCase() === ctx.browserFamily.toLowerCase());
    }

    case 'country': {
      // { "countries": ["DE", "AT", "CH"] }
      const countries = val.countries as string[] | undefined;
      if (!countries || !Array.isArray(countries) || !ctx.country) return false;
      return countries.some((c) => c.toUpperCase() === ctx.country!.toUpperCase());
    }

    case 'time_range': {
      // { "from": "08:00", "to": "18:00", "timezone": "Europe/Berlin" }
      const from = val.from as string | undefined;
      const to = val.to as string | undefined;
      if (!from || !to) return false;

      const tz = (val.timezone as string) || 'UTC';
      const now = new Date();

      let currentTime: string;
      try {
        currentTime = now.toLocaleTimeString('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } catch {
        // Invalid timezone — fall back to UTC
        currentTime = now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }

      // Compare as HH:MM strings (works for same-day ranges)
      if (from <= to) {
        return currentTime >= from && currentTime <= to;
      }
      // Overnight range (e.g. "22:00" to "06:00")
      return currentTime >= from || currentTime <= to;
    }

    case 'day_of_week': {
      // { "days": [1, 2, 3, 4, 5], "timezone": "Europe/Berlin" }
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const days = val.days as number[] | undefined;
      if (!days || !Array.isArray(days)) return false;

      const tz = (val.timezone as string) || 'UTC';
      const now = new Date();

      let dayOfWeek: number;
      try {
        const dayStr = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
        const dayMap: Record<string, number> = {
          Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
        };
        dayOfWeek = dayMap[dayStr] ?? now.getUTCDay();
      } catch {
        dayOfWeek = now.getUTCDay();
      }

      return days.includes(dayOfWeek);
    }

    default:
      return false;
  }
}
