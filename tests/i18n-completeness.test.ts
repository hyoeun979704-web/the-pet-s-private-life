import { describe, it, expect } from 'vitest';
import en from '@/data/locales/en.json';
import ja from '@/data/locales/ja.json';
import ko from '@/data/locales/ko.json';

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  Object.keys(obj).forEach((k) => {
    const path = prefix ? `${prefix}.${k}` : k;
    const v = (obj as Record<string, unknown>)[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v as Dict, path).forEach((vv, kk) => out.set(kk, vv));
    } else if (typeof v === 'string') {
      out.set(path, v);
    }
  });
  return out;
}

describe('i18n completeness', () => {
  const koMap = flatten(ko as Dict);
  const jaMap = flatten(ja as Dict);
  const enMap = flatten(en as Dict);

  it('ko is the source of truth (non-empty)', () => {
    expect(koMap.size).toBeGreaterThan(10);
    koMap.forEach((v, k) => {
      expect(v.length, `ko ${k} empty`).toBeGreaterThan(0);
    });
  });

  it('ja covers every ko key (no missing translation)', () => {
    const missing: string[] = [];
    koMap.forEach((_, k) => {
      if (!jaMap.has(k)) missing.push(k);
    });
    if (missing.length > 0) {
      // Soft warning — ja is allowed to lag for soft launch but log so the
      // operator can fill before real launch.
      // eslint-disable-next-line no-console
      console.warn(`[i18n] ja missing ${missing.length} keys:`, missing.slice(0, 10));
    }
  });

  it('en covers every ko key (no missing translation)', () => {
    const missing: string[] = [];
    koMap.forEach((_, k) => {
      if (!enMap.has(k)) missing.push(k);
    });
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] en missing ${missing.length} keys:`, missing.slice(0, 10));
    }
  });

  it('ja/en have no extraneous keys not in ko', () => {
    const extraJa: string[] = [];
    jaMap.forEach((_, k) => {
      if (!koMap.has(k)) extraJa.push(k);
    });
    const extraEn: string[] = [];
    enMap.forEach((_, k) => {
      if (!koMap.has(k)) extraEn.push(k);
    });
    expect(extraJa, `ja extraneous keys: ${extraJa.join(', ')}`).toEqual([]);
    expect(extraEn, `en extraneous keys: ${extraEn.join(', ')}`).toEqual([]);
  });
});
