import { describe, it, expect } from 'vitest';
import {
  DESIGN_TOKENS,
  GACHA_CONFIG,
  FATIGUE_CONFIG,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from '@/config/Constants';

describe('Constants', () => {
  it('gacha rates sum to 1.0', () => {
    const sum =
      GACHA_CONFIG.rates.normal + GACHA_CONFIG.rates.rare + GACHA_CONFIG.rates.legendary;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('design token primary color is a 7-char hex', () => {
    expect(DESIGN_TOKENS.color.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('fatigue costs are all positive integers', () => {
    Object.values(FATIGUE_CONFIG.costs).forEach((cost) => {
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    });
  });

  it('default locale is included in supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });
});
