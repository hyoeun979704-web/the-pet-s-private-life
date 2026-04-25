import iapData from '@/data/iapSkus.json';
import type { IapSku, IapSkuId } from '@/entities/IapSku';
import type { GameState } from '@/systems/GameState';
import { logger } from '@/utils/Logger';

export interface PurchasedReceipt {
  productId: string;
  purchaseToken: string;
  skuId: IapSkuId;
}

export interface IapAdapter {
  /** Launches the platform purchase flow. */
  purchase(productId: string): Promise<PurchasedReceipt | null>;
  /** Returns previously purchased non-consumables for restore flow. */
  queryEntitlements(): Promise<PurchasedReceipt[]>;
}

export interface ValidateFn {
  (receipt: PurchasedReceipt): Promise<{ ok: boolean; error?: unknown }>;
}

export interface IapSystemOptions {
  adapter: IapAdapter;
  gameState: GameState;
  validateFn?: ValidateFn;
  /** Feature flag — set false in β. Default true. */
  enabled?: boolean;
}

export interface PurchaseResult {
  ok: boolean;
  reason?:
    | 'iap-disabled'
    | 'unknown-sku'
    | 'cancelled'
    | 'platform-error'
    | 'verification-failed';
  receipt?: PurchasedReceipt;
}

const SKUS: IapSku[] = iapData.skus as unknown as IapSku[];
const SKU_BY_ID: Map<IapSkuId, IapSku> = new Map(SKUS.map((s) => [s.id, s]));
const SKU_BY_PRODUCT_ID: Map<string, IapSku> = new Map(SKUS.map((s) => [s.productId, s]));

export class IAPSystem {
  private readonly adapter: IapAdapter;

  private readonly gameState: GameState;

  private readonly validateFn: ValidateFn | null;

  private readonly enabled: boolean;

  constructor(opts: IapSystemOptions) {
    this.adapter = opts.adapter;
    this.gameState = opts.gameState;
    this.validateFn = opts.validateFn ?? null;
    this.enabled = opts.enabled ?? true;
  }

  static catalog(): readonly IapSku[] {
    return SKUS;
  }

  static getSku(id: IapSkuId): IapSku | null {
    return SKU_BY_ID.get(id) ?? null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async purchase(skuId: IapSkuId): Promise<PurchaseResult> {
    if (!this.enabled) return { ok: false, reason: 'iap-disabled' };
    const sku = SKU_BY_ID.get(skuId);
    if (!sku) return { ok: false, reason: 'unknown-sku' };

    let receipt: PurchasedReceipt | null;
    try {
      receipt = await this.adapter.purchase(sku.productId);
    } catch (err) {
      logger.error('iap.purchase.threw', { skuId, err: String(err) });
      return { ok: false, reason: 'platform-error' };
    }
    if (!receipt) return { ok: false, reason: 'cancelled' };

    if (this.validateFn) {
      try {
        const v = await this.validateFn(receipt);
        if (!v.ok) {
          logger.error('iap.verify.failed', { skuId });
          return { ok: false, reason: 'verification-failed' };
        }
      } catch (err) {
        logger.error('iap.verify.threw', { skuId, err: String(err) });
        return { ok: false, reason: 'verification-failed' };
      }
    } else {
      // Dev mode: skip verification but still log so reviews surface this.
      logger.warn('iap.verify.skipped', { skuId });
    }

    await this.applyEntitlement(sku);
    logger.info('iap.purchase.ok', { skuId });
    return { ok: true, receipt };
  }

  /**
   * Restores non-consumable purchases (e.g. remove_ads) on a fresh install.
   * Idempotent — re-applying flag entitlements is safe.
   */
  async restore(): Promise<{ restored: IapSkuId[] }> {
    if (!this.enabled) return { restored: [] };
    const receipts = await this.adapter.queryEntitlements();
    const restored: IapSkuId[] = [];
    // Sequential: each grant patches GameState; reduce keeps order.
    await receipts.reduce(async (prev, r) => {
      await prev;
      const sku = SKU_BY_PRODUCT_ID.get(r.productId);
      if (!sku || sku.kind !== 'non_consumable') return;
      if (this.validateFn) {
        const v = await this.validateFn(r);
        if (!v.ok) return;
      }
      await this.applyEntitlement(sku);
      restored.push(sku.id);
    }, Promise.resolve());
    logger.info('iap.restore.done', { count: restored.length });
    return { restored };
  }

  private async applyEntitlement(sku: IapSku): Promise<void> {
    await this.gameState.patch((d) => {
      if (sku.entitlement.kind === 'resources') {
        const ds = sku.entitlement.deltas;
        return {
          ...d,
          resources: {
            ...d.resources,
            snack: d.resources.snack + (ds.snack ?? 0),
            starDust: d.resources.starDust + (ds.starDust ?? 0),
            magicStone: d.resources.magicStone + (ds.magicStone ?? 0),
            gachaTicket: d.resources.gachaTicket + (ds.gachaTicket ?? 0),
          },
        };
      }
      // flag entitlement
      return {
        ...d,
        settings: { ...d.settings, adsRemoved: true },
      };
    });
  }
}

// -----------------------------------------------------------------------------
// Built-in adapters
// -----------------------------------------------------------------------------

/** Always-succeeds adapter for dev — simulates a successful purchase. */
export class MockIapAdapter implements IapAdapter {
  async purchase(productId: string): Promise<PurchasedReceipt | null> {
    const sku = SKU_BY_PRODUCT_ID.get(productId);
    if (!sku) return null;
    return {
      productId,
      purchaseToken: `mock_${Date.now()}`,
      skuId: sku.id,
    };
  }

  async queryEntitlements(): Promise<PurchasedReceipt[]> {
    return [];
  }
}

/** User-cancelled adapter for testing the cancel branch. */
export class CancelIapAdapter implements IapAdapter {
  async purchase(): Promise<PurchasedReceipt | null> {
    return null;
  }

  async queryEntitlements(): Promise<PurchasedReceipt[]> {
    return [];
  }
}
