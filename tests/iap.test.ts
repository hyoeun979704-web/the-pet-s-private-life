import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import {
  CancelIapAdapter,
  IAPSystem,
  MockIapAdapter,
  type IapAdapter,
  type ValidateFn,
} from '@/systems/IAPSystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

function makeGameState() {
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  return new GameState(createInitialSaveData('p1', 0), sys);
}

const validateOk: ValidateFn = async () => ({ ok: true });
const validateFail: ValidateFn = async () => ({ ok: false });

describe('IAPSystem', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = makeGameState();
  });

  it('isEnabled false when constructed with enabled: false', () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState, enabled: false });
    expect(iap.isEnabled()).toBe(false);
  });

  it('purchase rejects with iap-disabled when feature flag off', async () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState, enabled: false });
    const res = await iap.purchase('starter_pack');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('iap-disabled');
  });

  it('purchase rejects unknown sku', async () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState });
    const res = await iap.purchase('not_a_sku' as never);
    expect(res.reason).toBe('unknown-sku');
  });

  it('cancelled purchase reports cancelled reason', async () => {
    const iap = new IAPSystem({ adapter: new CancelIapAdapter(), gameState, validateFn: validateOk });
    const res = await iap.purchase('starter_pack');
    expect(res.reason).toBe('cancelled');
  });

  it('platform-error when adapter throws', async () => {
    const throwing: IapAdapter = {
      async purchase() {
        throw new Error('SDK boom');
      },
      async queryEntitlements() {
        return [];
      },
    };
    const iap = new IAPSystem({ adapter: throwing, gameState, validateFn: validateOk });
    const res = await iap.purchase('starter_pack');
    expect(res.reason).toBe('platform-error');
  });

  it('verification-failed when validateFn returns ok=false', async () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState, validateFn: validateFail });
    const res = await iap.purchase('starter_pack');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('verification-failed');
    // No entitlement applied on failed verification.
    expect(gameState.get().resources.snack).toBe(0);
  });

  it('successful starter_pack purchase grants resource entitlement', async () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState, validateFn: validateOk });
    const res = await iap.purchase('starter_pack');
    expect(res.ok).toBe(true);
    const r = gameState.get().resources;
    expect(r.snack).toBe(500);
    expect(r.starDust).toBe(100);
    expect(r.magicStone).toBe(5);
    expect(r.gachaTicket).toBe(3);
  });

  it('remove_ads sets adsRemoved flag in settings', async () => {
    const iap = new IAPSystem({ adapter: new MockIapAdapter(), gameState, validateFn: validateOk });
    await iap.purchase('remove_ads');
    expect(gameState.get().settings.adsRemoved).toBe(true);
  });

  it('restore replays non-consumable entitlements verified by server', async () => {
    const restoreAdapter: IapAdapter = {
      async purchase() {
        return null;
      },
      async queryEntitlements() {
        return [
          {
            productId: 'com.hyoeun979704.tpp.remove_ads',
            purchaseToken: 'restore_tok',
            skuId: 'remove_ads',
          },
        ];
      },
    };
    const iap = new IAPSystem({ adapter: restoreAdapter, gameState, validateFn: validateOk });
    const out = await iap.restore();
    expect(out.restored).toEqual(['remove_ads']);
    expect(gameState.get().settings.adsRemoved).toBe(true);
  });

  it('catalog() returns all 4 SKUs', () => {
    const ids = IAPSystem.catalog().map((s) => s.id).sort();
    expect(ids).toEqual([
      'magic_stone_medium',
      'magic_stone_small',
      'remove_ads',
      'starter_pack',
    ]);
  });
});
