/* eslint-disable import/no-relative-packages */
import { describe, it, expect } from 'vitest';
import furnitureData from '@/data/furniture.json';
import { FURNITURE_PRICES } from '../functions/src/shared/furnitureCatalog';
/* eslint-enable import/no-relative-packages */

type Row = {
  id: string;
  priceSnack?: number;
  priceStarDust?: number;
};

const rows = furnitureData.items as unknown as Row[];

describe('furniture-catalog-sync: client furniture.json vs functions/shared', () => {
  it('every priced client item appears in the server catalog with matching price', () => {
    rows.forEach((row) => {
      const serverPrice = FURNITURE_PRICES[row.id];
      if (row.priceSnack !== undefined || row.priceStarDust !== undefined) {
        expect(serverPrice, `missing server price for ${row.id}`).toBeDefined();
        expect(serverPrice?.snack ?? 0).toBe(row.priceSnack ?? 0);
        expect(serverPrice?.starDust ?? 0).toBe(row.priceStarDust ?? 0);
      }
    });
  });

  it('every server catalog id exists in the client data', () => {
    const clientIds = new Set(rows.map((r) => r.id));
    Object.keys(FURNITURE_PRICES).forEach((id) => {
      expect(clientIds.has(id), `server id ${id} not in client data`).toBe(true);
    });
  });
});
