import { describe, it, expect } from 'vitest';
import type { FurnitureDef } from '@/entities/Furniture';
import type { Resources } from '@/entities/SaveData';
import { ShopSystem, type PurchaseFn } from '@/systems/ShopSystem';

const RUG: FurnitureDef = {
  id: 'furn_rug_basic',
  nameKey: 'x',
  category: 'floor',
  grade: 'normal',
  footprintW: 2,
  footprintH: 2,
  cozyScore: 5,
  colorHex: '#FFC8DD',
  priceSnack: 30,
};

const LAMP: FurnitureDef = {
  id: 'furn_lamp_warm',
  nameKey: 'x',
  category: 'decor',
  grade: 'rare',
  footprintW: 1,
  footprintH: 1,
  cozyScore: 8,
  colorHex: '#A0C4FF',
  priceStarDust: 15,
};

function okFn(): PurchaseFn {
  return async (defId, quantity) => ({
    ok: true,
    defId,
    quantity,
    spent: {},
  });
}

function wallet(overrides: Partial<Resources> = {}): Resources {
  return {
    snack: 0,
    starDust: 0,
    magicStone: 0,
    magicShard: 0,
    gachaTicket: 0,
    ...overrides,
  };
}

describe('ShopSystem', () => {
  it('getPrice multiplies by quantity', () => {
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet(), purchaseFn: okFn() });
    expect(sys.getPrice(RUG.id, 3)).toEqual({ snack: 90 });
  });

  it('getPrice returns null for unknown item', () => {
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet(), purchaseFn: okFn() });
    expect(sys.getPrice('missing')).toBeNull();
  });

  it('canAfford false when wallet is short', () => {
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet({ snack: 10 }), purchaseFn: okFn() });
    expect(sys.canAfford(RUG.id, 1)).toBe(false);
  });

  it('purchase rejects invalid quantity', async () => {
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet({ snack: 100 }), purchaseFn: okFn() });
    const res = await sys.purchase(RUG.id, 0);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('invalid-quantity');
  });

  it('purchase rejects unknown furniture', async () => {
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet({ snack: 100 }), purchaseFn: okFn() });
    const res = await sys.purchase('not_real', 1);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown-furniture');
  });

  it('purchase rejects when wallet is short without calling server', async () => {
    let called = 0;
    const fn: PurchaseFn = async () => {
      called += 1;
      return { ok: true };
    };
    const sys = new ShopSystem({ defs: [RUG], getWallet: () => wallet({ snack: 10 }), purchaseFn: fn });
    const res = await sys.purchase(RUG.id, 1);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('insufficient-resources');
    expect(called).toBe(0);
  });

  it('purchase forwards to server on happy path', async () => {
    const sys = new ShopSystem({
      defs: [LAMP],
      getWallet: () => wallet({ starDust: 100 }),
      purchaseFn: okFn(),
    });
    const res = await sys.purchase(LAMP.id, 2);
    expect(res.ok).toBe(true);
    expect(res.defId).toBe(LAMP.id);
    expect(res.quantity).toBe(2);
  });
});
