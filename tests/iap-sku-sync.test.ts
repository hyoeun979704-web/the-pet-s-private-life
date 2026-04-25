import { describe, it, expect } from 'vitest';
import iapData from '@/data/iapSkus.json';

const PREFIX = 'com.hyoeun979704.tpp.';

interface Sku {
  id: string;
  productId: string;
  kind: 'consumable' | 'non_consumable';
}

describe('iap-sku-sync', () => {
  const skus = iapData.skus as unknown as Sku[];

  it('every productId starts with the platform prefix the server validates', () => {
    skus.forEach((s) => {
      expect(s.productId.startsWith(PREFIX), `${s.id} -> ${s.productId}`).toBe(true);
    });
  });

  it('productIds are unique across the catalog', () => {
    const seen = new Set<string>();
    skus.forEach((s) => {
      expect(seen.has(s.productId), `duplicate productId ${s.productId}`).toBe(false);
      seen.add(s.productId);
    });
  });

  it('every sku.id is unique too', () => {
    const seen = new Set<string>();
    skus.forEach((s) => {
      expect(seen.has(s.id), `duplicate sku.id ${s.id}`).toBe(false);
      seen.add(s.id);
    });
  });
});
