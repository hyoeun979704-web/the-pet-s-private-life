import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FURNITURE_PRICES } from './shared/furnitureCatalog';
import { playerDocRef, requireAuthUid } from './util';

interface Payload {
  furnitureDefId: string;
  quantity?: number;
}

interface OwnedRow {
  defId: string;
  count: number;
}

export const purchaseFurniture = onCall<Payload>(async (req) => {
  const uid = requireAuthUid(req);
  const { furnitureDefId, quantity = 1 } = req.data ?? ({} as Payload);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new HttpsError('invalid-argument', 'quantity must be an integer 1..10');
  }

  const price = FURNITURE_PRICES[furnitureDefId];
  if (!price) {
    throw new HttpsError('invalid-argument', `unknown furniture: ${furnitureDefId}`);
  }

  const totalSnack = (price.snack ?? 0) * quantity;
  const totalStarDust = (price.starDust ?? 0) * quantity;

  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'player document missing');
    }
    const data = snap.data() ?? {};
    const resources = (data.resources as { snack?: number; starDust?: number } | undefined) ?? {};
    const owned = (data.furniture as OwnedRow[] | undefined) ?? [];

    const walletSnack = resources.snack ?? 0;
    const walletStar = resources.starDust ?? 0;
    if (walletSnack < totalSnack || walletStar < totalStarDust) {
      throw new HttpsError('failed-precondition', 'insufficient resources');
    }

    const idx = owned.findIndex((o) => o.defId === furnitureDefId);
    const nextOwned = owned.slice();
    if (idx >= 0) {
      const current = nextOwned[idx] as OwnedRow;
      nextOwned[idx] = { ...current, count: current.count + quantity };
    } else {
      nextOwned.push({ defId: furnitureDefId, count: quantity });
    }

    const updates: Record<string, unknown> = {
      furniture: nextOwned,
    };
    if (totalSnack > 0) updates['resources.snack'] = walletSnack - totalSnack;
    if (totalStarDust > 0) updates['resources.starDust'] = walletStar - totalStarDust;

    tx.update(ref, updates);
    return {
      ok: true,
      defId: furnitureDefId,
      quantity,
      spent: { snack: totalSnack, starDust: totalStarDust },
    };
  });
});
