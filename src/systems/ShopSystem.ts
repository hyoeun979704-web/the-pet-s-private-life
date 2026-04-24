import type { ResourceKey } from '@/config/Constants';
import type { FurnitureDef } from '@/entities/Furniture';
import type { Resources } from '@/entities/SaveData';

export interface PurchaseResult {
  ok: boolean;
  reason?: 'unknown-furniture' | 'insufficient-resources' | 'invalid-quantity' | 'server-denied' | 'offline';
  defId?: string;
  quantity?: number;
  spent?: Partial<Record<ResourceKey, number>>;
  error?: unknown;
}

export interface PurchaseFn {
  (furnitureDefId: string, quantity: number): Promise<PurchaseResult>;
}

export interface ShopSystemOptions {
  defs: readonly FurnitureDef[];
  getWallet: () => Resources;
  purchaseFn: PurchaseFn;
}

export class ShopSystem {
  private readonly defs: Map<string, FurnitureDef>;

  private readonly getWallet: () => Resources;

  private readonly purchaseFn: PurchaseFn;

  constructor(options: ShopSystemOptions) {
    this.defs = new Map(options.defs.map((d) => [d.id, d]));
    this.getWallet = options.getWallet;
    this.purchaseFn = options.purchaseFn;
  }

  getPrice(defId: string, quantity = 1): Partial<Record<ResourceKey, number>> | null {
    const def = this.defs.get(defId);
    if (!def) return null;
    const price: Partial<Record<ResourceKey, number>> = {};
    if (def.priceSnack) price.snack = def.priceSnack * quantity;
    if (def.priceStarDust) price.starDust = def.priceStarDust * quantity;
    return price;
  }

  canAfford(defId: string, quantity = 1): boolean {
    const price = this.getPrice(defId, quantity);
    if (!price) return false;
    const w = this.getWallet();
    return (Object.keys(price) as ResourceKey[]).every((k) => (w[k] ?? 0) >= (price[k] ?? 0));
  }

  async purchase(defId: string, quantity = 1): Promise<PurchaseResult> {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { ok: false, reason: 'invalid-quantity' };
    }
    if (!this.defs.has(defId)) {
      return { ok: false, reason: 'unknown-furniture' };
    }
    if (!this.canAfford(defId, quantity)) {
      return { ok: false, reason: 'insufficient-resources' };
    }
    return this.purchaseFn(defId, quantity);
  }
}
