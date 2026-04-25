export type IapSkuId =
  | 'starter_pack'
  | 'remove_ads'
  | 'magic_stone_small'
  | 'magic_stone_medium';

export type IapKind = 'consumable' | 'non_consumable';

export interface IapSku {
  id: IapSkuId;
  /** Maps to the Google Play console product ID. */
  productId: string;
  kind: IapKind;
  priceKrwHint: number;
  /** What the player gets after a successful + verified purchase. */
  entitlement:
    | { kind: 'resources'; deltas: Partial<{ snack: number; starDust: number; magicStone: number; gachaTicket: number }> }
    | { kind: 'flag'; flag: 'adsRemoved' };
}
