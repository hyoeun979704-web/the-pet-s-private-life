import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAuthUid } from './util';

interface Payload {
  productId: string;
  purchaseToken: string;
}

const ALLOWED_PRODUCT_PREFIX = 'com.hyoeun979704.tpp.';

/**
 * Receipt verification stub.
 *
 * Production wiring (deferred until Play Console + service account are
 * set up): use the Google Play Developer API
 *   androidpublisher.purchases.products.get
 *   androidpublisher.purchases.subscriptions.get
 * to verify the purchaseToken. On success, write an
 * /entitlements/{uid}/{productId} doc and have the client read it.
 *
 * This stub validates only the productId namespace so Cloud Functions
 * can be invoked end-to-end during integration testing without a real
 * Google API key.
 */
export const validatePurchase = onCall<Payload>(async (req) => {
  requireAuthUid(req);
  const { productId, purchaseToken } = req.data ?? ({} as Payload);
  if (typeof productId !== 'string' || !productId.startsWith(ALLOWED_PRODUCT_PREFIX)) {
    throw new HttpsError('invalid-argument', 'unknown productId');
  }
  if (typeof purchaseToken !== 'string' || purchaseToken.length < 8) {
    throw new HttpsError('invalid-argument', 'invalid purchase token');
  }
  // TODO: real verification via Google Play Developer API.
  return { ok: true, productId };
});
